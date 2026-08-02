import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAgencyByClerkOrg, requireAgencyOrg } from "./lib/auth";
import type { Id } from "./_generated/dataModel";

const postStatus = v.union(
  v.literal("approved"),
  v.literal("disapproved"),
  v.literal("published"),
  v.literal("failed"),
  v.literal("scheduled"),
);

async function assertClient(
  ctx: { db: { get: (id: Id<"clients">) => Promise<{ agencyId: Id<"agencies"> } | null> } },
  clientId: Id<"clients">,
  agencyId: Id<"agencies">,
) {
  const client = await ctx.db.get(clientId);
  if (!client || client.agencyId !== agencyId) return null;
  return client;
}

export const listPosts = query({
  args: {
    clientId: v.id("clients"),
    /** Look-ahead window in weeks (ADR-0037) */
    lookAheadWeeks: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) return [];
    if (!(await assertClient(ctx, args.clientId, agency._id))) return [];

    const weeks = args.lookAheadWeeks ?? 4;
    const now = Date.now();
    const horizon = now + weeks * 7 * 24 * 60 * 60 * 1000;

    const rows = await ctx.db
      .query("socialPosts")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    return rows
      .filter((p) => p.scheduledAt <= horizon)
      .sort((a, b) => a.scheduledAt - b.scheduledAt)
      .map((p) => ({
        id: p._id,
        body: p.body,
        mediaUrls: p.mediaUrls,
        link: p.link,
        channel: p.channel,
        scheduledAt: p.scheduledAt,
        status: p.status,
        editNotes: p.editNotes,
      }));
  },
});

/**
 * Create post — **default approved** (ADR-0037).
 * Status "scheduled" is still treated as approved-for-publish unless disapproved.
 */
export const schedulePost = mutation({
  args: {
    clientId: v.id("clients"),
    body: v.string(),
    channel: v.string(),
    scheduledAt: v.number(),
    mediaUrls: v.optional(v.array(v.string())),
    link: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");
    if (!(await assertClient(ctx, args.clientId, agency._id))) {
      throw new Error("client not found");
    }
    const body = args.body.trim();
    if (!body) throw new Error("body required");

    const id = await ctx.db.insert("socialPosts", {
      clientId: args.clientId,
      body,
      mediaUrls: args.mediaUrls ?? [],
      link: args.link,
      channel: args.channel,
      scheduledAt: args.scheduledAt,
      // Default approved look-ahead (ADR-0037)
      status: "approved",
    });
    return { id, status: "approved" as const };
  },
});

export const updatePost = mutation({
  args: {
    postId: v.id("socialPosts"),
    patch: v.object({
      body: v.optional(v.string()),
      mediaUrls: v.optional(v.array(v.string())),
      link: v.optional(v.string()),
      scheduledAt: v.optional(v.number()),
      editNotes: v.optional(v.string()),
      status: v.optional(postStatus),
    }),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("post not found");
    if (!(await assertClient(ctx, post.clientId, agency._id))) {
      throw new Error("post not in agency");
    }

    const patch: Record<string, unknown> = {};
    if (args.patch.body !== undefined) patch.body = args.patch.body.trim();
    if (args.patch.mediaUrls !== undefined) patch.mediaUrls = args.patch.mediaUrls;
    if (args.patch.link !== undefined) patch.link = args.patch.link;
    if (args.patch.scheduledAt !== undefined) patch.scheduledAt = args.patch.scheduledAt;
    if (args.patch.editNotes !== undefined) patch.editNotes = args.patch.editNotes;
    if (args.patch.status !== undefined) patch.status = args.patch.status;

    // Edits keep approved unless explicitly disapproved (ADR-0037)
    if (
      (args.patch.body !== undefined || args.patch.mediaUrls !== undefined) &&
      post.status === "approved" &&
      args.patch.status === undefined
    ) {
      patch.status = "approved";
    }

    await ctx.db.patch(args.postId, patch);
    return { id: args.postId, ...args.patch };
  },
});

export const disapprove = mutation({
  args: {
    postId: v.id("socialPosts"),
    editNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("post not found");
    if (!(await assertClient(ctx, post.clientId, agency._id))) {
      throw new Error("post not in agency");
    }
    await ctx.db.patch(args.postId, {
      status: "disapproved",
      editNotes: args.editNotes ?? post.editNotes,
    });
    return { id: args.postId, status: "disapproved" as const };
  },
});

/**
 * Publish failure → notify path + reschedule before next post (ADR-0038).
 * Returns new schedule suggestion; caller/agent may apply.
 */
export const markFailedAndReschedule = mutation({
  args: {
    postId: v.id("socialPosts"),
    /** Prefer scheduling just before the next approved post; else +1 day */
    rescheduleAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("post not found");
    if (!(await assertClient(ctx, post.clientId, agency._id))) {
      throw new Error("post not in agency");
    }

    const siblings = await ctx.db
      .query("socialPosts")
      .withIndex("by_client", (q) => q.eq("clientId", post.clientId))
      .collect();

    const next = siblings
      .filter(
        (p) =>
          p._id !== post._id &&
          p.scheduledAt > post.scheduledAt &&
          (p.status === "approved" || p.status === "scheduled"),
      )
      .sort((a, b) => a.scheduledAt - b.scheduledAt)[0];

    const rescheduleAt =
      args.rescheduleAt ??
      (next
        ? next.scheduledAt - 60 * 60 * 1000 // 1h before next post
        : post.scheduledAt + 24 * 60 * 60 * 1000);

    await ctx.db.patch(args.postId, {
      status: "approved", // back to default-approved after failure recovery
      scheduledAt: rescheduleAt,
      editNotes: [post.editNotes, "Auto-rescheduled after publish failure"]
        .filter(Boolean)
        .join(" · "),
    });

    return {
      id: args.postId,
      status: "approved" as const,
      scheduledAt: rescheduleAt,
      notify: ["agency", "client"] as const,
    };
  },
});
