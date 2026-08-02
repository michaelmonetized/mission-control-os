import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { getAgencyByClerkOrg, requireAgencyOrg } from "./lib/auth";

/**
 * Agency activity feed — cross-module audit trail (ADR-0031 ops surface).
 */

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) return [];
    const rows = await ctx.db
      .query("activityEvents")
      .withIndex("by_agency", (q) => q.eq("agencyId", agency._id))
      .order("desc")
      .take(args.limit ?? 40);
    return rows.map((r) => ({
      id: r._id,
      kind: r.kind,
      message: r.message,
      actorUserId: r.actorUserId,
      entityType: r.entityType,
      entityId: r.entityId,
      createdAt: r.createdAt,
    }));
  },
});

export const log = mutation({
  args: {
    kind: v.string(),
    message: v.string(),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId, identity } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");
    const id = await ctx.db.insert("activityEvents", {
      agencyId: agency._id,
      kind: args.kind,
      message: args.message,
      actorUserId: identity.subject,
      entityType: args.entityType,
      entityId: args.entityId,
      createdAt: Date.now(),
    });
    return { id };
  },
});

export const logInternal = internalMutation({
  args: {
    agencyId: v.id("agencies"),
    kind: v.string(),
    message: v.string(),
    actorUserId: v.optional(v.string()),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("activityEvents", {
      agencyId: args.agencyId,
      kind: args.kind,
      message: args.message,
      actorUserId: args.actorUserId,
      entityType: args.entityType,
      entityId: args.entityId,
      createdAt: Date.now(),
    });
  },
});
