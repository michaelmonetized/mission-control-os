import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { getAgencyByClerkOrg, requireAgencyOrg } from "./lib/auth";

/** Persist Trigger.dev handoff jobs (ADR-0046). */

export const enqueue = mutation({
  args: {
    automationId: v.id("automations"),
    fromStep: v.number(),
    reason: v.string(),
    idempotencyKey: v.string(),
    payload: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");

    const existing = await ctx.db
      .query("automationHandoffs")
      .withIndex("by_idempotency", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .unique();
    if (existing) {
      return { id: existing._id, existing: true, status: existing.status };
    }

    const auto = await ctx.db.get(args.automationId);
    if (!auto) throw new Error("automation not found");
    const ws = await ctx.db.get(auto.workspaceId);
    if (!ws || ws.agencyId !== agency._id) throw new Error("automation not in agency");

    const id = await ctx.db.insert("automationHandoffs", {
      automationId: args.automationId,
      agencyId: agency._id,
      fromStep: args.fromStep,
      reason: args.reason,
      idempotencyKey: args.idempotencyKey,
      payload: args.payload ?? {},
      status: "queued",
      createdAt: Date.now(),
    });
    return { id, existing: false, status: "queued" as const };
  },
});

export const listQueued = query({
  args: {},
  handler: async (ctx) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) return [];
    const rows = await ctx.db
      .query("automationHandoffs")
      .withIndex("by_agency", (q) => q.eq("agencyId", agency._id))
      .collect();
    return rows
      .filter((r) => r.status === "queued" || r.status === "processing")
      .map((r) => ({
        id: r._id,
        automationId: r.automationId,
        fromStep: r.fromStep,
        reason: r.reason,
        status: r.status,
        idempotencyKey: r.idempotencyKey,
        createdAt: r.createdAt,
      }));
  },
});

/** Full handoff history for ops UI (ADR-0046). */
export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) return [];
    const rows = await ctx.db
      .query("automationHandoffs")
      .withIndex("by_agency", (q) => q.eq("agencyId", agency._id))
      .collect();
    return rows
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, args.limit ?? 40)
      .map((r) => ({
        id: r._id,
        automationId: r.automationId,
        fromStep: r.fromStep,
        reason: r.reason,
        status: r.status,
        idempotencyKey: r.idempotencyKey,
        createdAt: r.createdAt,
      }));
  },
});

export const mark = mutation({
  args: {
    handoffId: v.id("automationHandoffs"),
    status: v.union(
      v.literal("processing"),
      v.literal("done"),
      v.literal("failed"),
      v.literal("queued"),
    ),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");
    const row = await ctx.db.get(args.handoffId);
    if (!row || row.agencyId !== agency._id) throw new Error("not found");
    await ctx.db.patch(args.handoffId, { status: args.status });
    return { ok: true };
  },
});

/** Trigger worker: list queued handoffs (shared secret HTTP). */
export const listQueuedInternal = internalQuery({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const rows = await ctx.db.query("automationHandoffs").collect();
    return rows
      .filter((r) => r.status === "queued")
      .sort((a, b) => a.createdAt - b.createdAt)
      .slice(0, args.limit ?? 20)
      .map((r) => ({
        id: r._id,
        automationId: r.automationId,
        agencyId: r.agencyId,
        fromStep: r.fromStep,
        reason: r.reason,
        idempotencyKey: r.idempotencyKey,
        payload: r.payload,
        createdAt: r.createdAt,
      }));
  },
});

/** Trigger worker: claim one handoff → processing. */
export const claimInternal = internalMutation({
  args: { handoffId: v.id("automationHandoffs") },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.handoffId);
    if (!row || row.status !== "queued") throw new Error("not claimable");
    await ctx.db.patch(args.handoffId, { status: "processing" });
    return {
      id: row._id,
      automationId: row.automationId,
      agencyId: row.agencyId,
      fromStep: row.fromStep,
      reason: row.reason,
      idempotencyKey: row.idempotencyKey,
      payload: row.payload,
    };
  },
});

/**
 * Trigger worker: mark done after resume (remaining steps run on next inline or re-queue).
 * Completes wait/failure plane for ADR-0046.
 */
export const completeInternal = internalMutation({
  args: {
    handoffId: v.id("automationHandoffs"),
    status: v.union(v.literal("done"), v.literal("failed")),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.handoffId);
    if (!row) throw new Error("handoff not found");
    await ctx.db.patch(args.handoffId, { status: args.status });
    return { ok: true, id: args.handoffId, note: args.note };
  },
});
