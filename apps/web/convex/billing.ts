import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { getAgencyByClerkOrg, requireAgencyOrg } from "./lib/auth";

/**
 * Direct Stripe subscription billing (ADR-0001 / ADR-0031).
 * Schema lives on subscriptions; Stripe webhook → upsertFromStripe (internal).
 * Dev/settings can mock-activate a plan without Stripe keys.
 */

export const PLANS = {
  starter: { label: "Starter", priceMonthly: 99, seats: 3 },
  pro: { label: "Agency Pro", priceMonthly: 299, seats: 15 },
  enterprise: { label: "Enterprise", priceMonthly: 699, seats: 100 },
} as const;

export type PlanId = keyof typeof PLANS;

export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) return null;
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_agency", (q) => q.eq("agencyId", agency._id))
      .unique();
    if (!sub) {
      return {
        plan: null as PlanId | null,
        status: "none" as const,
        catalog: PLANS,
        currentPeriodEnd: null as number | null,
        stripeCustomerId: null as string | null,
      };
    }
    return {
      plan: sub.plan as PlanId,
      status: sub.status,
      catalog: PLANS,
      currentPeriodEnd: sub.currentPeriodEnd,
      stripeCustomerId: sub.stripeCustomerId,
      stripeSubscriptionId: sub.stripeSubscriptionId,
    };
  },
});

/**
 * Dev / ops mock: activate a plan without Stripe (settings UI).
 * Production path is upsertFromStripe via webhook.
 */
export const mockActivate = mutation({
  args: {
    plan: v.union(v.literal("starter"), v.literal("pro"), v.literal("enterprise")),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId, isAdmin } = await requireAgencyOrg(ctx);
    if (!isAdmin) throw new Error("Admin only");
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");

    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_agency", (q) => q.eq("agencyId", agency._id))
      .unique();

    const periodEnd = Date.now() + 30 * 864e5;
    if (existing) {
      await ctx.db.patch(existing._id, {
        plan: args.plan,
        status: "active",
        currentPeriodEnd: periodEnd,
      });
      return { id: existing._id, plan: args.plan, mock: true };
    }

    const id = await ctx.db.insert("subscriptions", {
      agencyId: agency._id,
      stripeCustomerId: `cus_mock_${agency._id}`,
      stripeSubscriptionId: `sub_mock_${Date.now()}`,
      plan: args.plan,
      status: "active",
      currentPeriodEnd: periodEnd,
    });
    return { id, plan: args.plan, mock: true };
  },
});

export const cancelMine = mutation({
  args: {},
  handler: async (ctx) => {
    const { clerkOrgId, isAdmin } = await requireAgencyOrg(ctx);
    if (!isAdmin) throw new Error("Admin only");
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_agency", (q) => q.eq("agencyId", agency._id))
      .unique();
    if (!existing) return { ok: false, reason: "no_subscription" as const };
    await ctx.db.patch(existing._id, { status: "canceled" });
    return { ok: true };
  },
});

/** Stripe webhook / Trigger worker path — secret-gated HTTP only. */
export const upsertFromStripe = internalMutation({
  args: {
    agencyId: v.id("agencies"),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    plan: v.union(v.literal("starter"), v.literal("pro"), v.literal("enterprise")),
    status: v.union(
      v.literal("active"),
      v.literal("past_due"),
      v.literal("canceled"),
      v.literal("trialing"),
    ),
    currentPeriodEnd: v.number(),
  },
  handler: async (ctx, args) => {
    const byStripe = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripeSub", (q) => q.eq("stripeSubscriptionId", args.stripeSubscriptionId))
      .unique();
    if (byStripe) {
      await ctx.db.patch(byStripe._id, {
        plan: args.plan,
        status: args.status,
        currentPeriodEnd: args.currentPeriodEnd,
        stripeCustomerId: args.stripeCustomerId,
      });
      return { id: byStripe._id };
    }
    const byAgency = await ctx.db
      .query("subscriptions")
      .withIndex("by_agency", (q) => q.eq("agencyId", args.agencyId))
      .unique();
    if (byAgency) {
      await ctx.db.patch(byAgency._id, {
        stripeCustomerId: args.stripeCustomerId,
        stripeSubscriptionId: args.stripeSubscriptionId,
        plan: args.plan,
        status: args.status,
        currentPeriodEnd: args.currentPeriodEnd,
      });
      return { id: byAgency._id };
    }
    const id = await ctx.db.insert("subscriptions", {
      agencyId: args.agencyId,
      stripeCustomerId: args.stripeCustomerId,
      stripeSubscriptionId: args.stripeSubscriptionId,
      plan: args.plan,
      status: args.status,
      currentPeriodEnd: args.currentPeriodEnd,
    });
    return { id };
  },
});
