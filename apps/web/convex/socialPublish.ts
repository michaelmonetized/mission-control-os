import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAgencyByClerkOrg, requireAgencyOrg } from "./lib/auth";

/**
 * Publish pipeline (ADR-0037/0038) — due posts, publish success/fail + reschedule.
 */

export const listDue = query({
  args: {
    clientId: v.id("clients"),
    beforeMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) return [];
    const client = await ctx.db.get(args.clientId);
    if (!client || client.agencyId !== agency._id) return [];
    const before = args.beforeMs ?? Date.now();
    const rows = await ctx.db
      .query("socialPosts")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();
    return rows
      .filter(
        (p) =>
          p.scheduledAt <= before &&
          (p.status === "approved" || p.status === "scheduled"),
      )
      .map((p) => ({
        id: p._id,
        body: p.body,
        channel: p.channel,
        scheduledAt: p.scheduledAt,
        status: p.status,
      }));
  },
});

export const markPublished = mutation({
  args: { postId: v.id("socialPosts") },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("not found");
    const client = await ctx.db.get(post.clientId);
    if (!client || client.agencyId !== agency._id) throw new Error("not found");
    if (post.status === "disapproved") throw new Error("cannot publish disapproved post");
    await ctx.db.patch(args.postId, { status: "published" });
    return { id: args.postId, status: "published" as const };
  },
});

/** Simulate connected-account publish; on failure reschedule (ADR-0038). */
export const attemptPublish = mutation({
  args: {
    postId: v.id("socialPosts"),
    forceFail: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("not found");
    const client = await ctx.db.get(post.clientId);
    if (!client || client.agencyId !== agency._id) throw new Error("not found");
    if (post.status === "disapproved") throw new Error("disapproved");

    if (args.forceFail) {
      // same logic as markFailedAndReschedule
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
      const rescheduleAt = next
        ? next.scheduledAt - 60 * 60 * 1000
        : post.scheduledAt + 24 * 60 * 60 * 1000;
      await ctx.db.patch(args.postId, {
        status: "approved",
        scheduledAt: rescheduleAt,
        editNotes: [post.editNotes, "Publish failed — rescheduled; notify Agency+Client"]
          .filter(Boolean)
          .join(" · "),
      });
      return {
        ok: false as const,
        status: "failed_rescheduled" as const,
        scheduledAt: rescheduleAt,
        notify: ["agency", "client"] as const,
      };
    }

    await ctx.db.patch(args.postId, { status: "published" });
    return { ok: true as const, status: "published" as const };
  },
});
