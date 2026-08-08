import { v } from "convex/values";
import { internalMutation, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAgencyByClerkOrg, requireAgencyOrg } from "./lib/auth";

/**
 * Schedule delayed automation steps (ADR-0046 wait/delay).
 * Uses Convex scheduler — Trigger is for failure recovery, not primary waits.
 */

export const scheduleWaitResume = mutation({
  args: {
    automationId: v.id("automations"),
    fromStep: v.number(),
    delayMs: v.number(),
    idempotencyKey: v.string(),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");
    const auto = await ctx.db.get(args.automationId);
    if (!auto) throw new Error("automation not found");
    const ws = await ctx.db.get(auto.workspaceId);
    if (!ws || ws.agencyId !== agency._id) throw new Error("not found");

    const delay = Math.max(1000, Math.min(args.delayMs, 7 * 24 * 60 * 60 * 1000));
    const handoffId = await ctx.db.insert("automationHandoffs", {
      automationId: args.automationId,
      agencyId: agency._id,
      fromStep: args.fromStep,
      reason: "scheduled_wait",
      idempotencyKey: args.idempotencyKey,
      payload: { delayMs: delay },
      status: "queued",
      createdAt: Date.now(),
    });

    await ctx.scheduler.runAfter(delay, internal.scheduler.markWaitComplete, {
      handoffId,
    });

    return { handoffId, delayMs: delay };
  },
});

export const markWaitComplete = internalMutation({
  args: { handoffId: v.id("automationHandoffs") },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.handoffId);
    if (!row) return;
    if (row.status === "done") return;
    await ctx.db.patch(args.handoffId, { status: "done" });
    // Future: resume remaining automation steps inline
  },
});
