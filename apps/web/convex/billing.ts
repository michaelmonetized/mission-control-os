import { v } from "convex/values";
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { getAgencyByClerkOrg, requireAgencyOrg } from "./lib/auth";
import type { Id } from "./_generated/dataModel";

/**
 * Direct Stripe subscription billing (ADR-0001 / ADR-0031).
 * Checkout + Customer Portal via Stripe REST; webhook → upsertFromStripe.
 * Dev/settings can mock-activate a plan without Stripe keys.
 */

export const PLANS = {
  starter: { label: "Starter", priceMonthly: 99, seats: 3 },
  pro: { label: "Agency Pro", priceMonthly: 299, seats: 15 },
  enterprise: { label: "Enterprise", priceMonthly: 699, seats: 100 },
} as const;

export type PlanId = keyof typeof PLANS;

const PLAN_IDS = ["starter", "pro", "enterprise"] as const;

/** Map plan → Stripe Price id from Convex env (STRIPE_PRICE_STARTER, …). */
export function priceIdForPlan(plan: PlanId): string | null {
  const key =
    plan === "starter"
      ? "STRIPE_PRICE_STARTER"
      : plan === "pro"
        ? "STRIPE_PRICE_PRO"
        : "STRIPE_PRICE_ENTERPRISE";
  const id = process.env[key]?.trim();
  return id || null;
}

export function planFromPriceId(priceId: string): PlanId | null {
  for (const plan of PLAN_IDS) {
    if (priceIdForPlan(plan) === priceId) return plan;
  }
  // metadata-only fallback when prices not in env of webhook runtime
  return null;
}

function stripeSecret(): string | null {
  return process.env.STRIPE_SECRET_KEY?.trim() || null;
}

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
        stripeSubscriptionId: null as string | null,
        hasCustomer: false,
      };
    }
    return {
      plan: sub.plan as PlanId,
      status: sub.status,
      catalog: PLANS,
      currentPeriodEnd: sub.currentPeriodEnd,
      stripeCustomerId: sub.stripeCustomerId,
      stripeSubscriptionId: sub.stripeSubscriptionId,
      hasCustomer: Boolean(sub.stripeCustomerId && !sub.stripeCustomerId.startsWith("cus_mock_")),
    };
  },
});

/**
 * Stripe Checkout Session (subscription mode).
 * Env: STRIPE_SECRET_KEY, STRIPE_PRICE_STARTER|PRO|ENTERPRISE, optional MC_APP_URL.
 */
export const createCheckoutSession = action({
  args: {
    plan: v.union(v.literal("starter"), v.literal("pro"), v.literal("enterprise")),
    successUrl: v.optional(v.string()),
    cancelUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const rec = identity as Record<string, unknown>;
    const orgId =
      (rec.org_id as string | undefined) ??
      (rec.orgId as string | undefined) ??
      ((rec.o as { id?: string } | undefined)?.id);
    const orgRole =
      (rec.org_role as string | undefined) ??
      (rec.orgRole as string | undefined) ??
      ((rec.o as { rol?: string } | undefined)?.rol);
    const isAdmin = orgRole === "org:admin" || orgRole === "admin";
    if (!orgId) throw new Error("No active Agency organization");
    if (!isAdmin) throw new Error("Admin only");

    const secret = stripeSecret();
    if (!secret) {
      return {
        ok: false as const,
        error: "STRIPE_SECRET_KEY not configured — use mock activate or set Convex env",
        mockSuggested: true,
      };
    }

    const priceId = priceIdForPlan(args.plan);
    if (!priceId) {
      return {
        ok: false as const,
        error: `Missing STRIPE_PRICE_${args.plan.toUpperCase()} in Convex env`,
        mockSuggested: true,
      };
    }

    const agency = await ctx.runQuery(internal.billing.getAgencyByClerkOrgInternal, {
      clerkOrgId: orgId,
    });
    if (!agency) throw new Error("Agency not found — complete onboarding first");

    const appUrl = (process.env.MC_APP_URL ?? process.env.VITE_APP_URL ?? "http://127.0.0.1:5173").replace(
      /\/$/,
      "",
    );
    const successUrl =
      args.successUrl ??
      `${appUrl}/app/settings?billing=success&plan=${args.plan}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = args.cancelUrl ?? `${appUrl}/app/settings?billing=cancel`;

    const email =
      (rec.email as string | undefined) ??
      (typeof identity.email === "string" ? identity.email : undefined);

    const body = new URLSearchParams();
    body.set("mode", "subscription");
    body.set("success_url", successUrl);
    body.set("cancel_url", cancelUrl);
    body.set("line_items[0][price]", priceId);
    body.set("line_items[0][quantity]", "1");
    body.set("client_reference_id", agency._id);
    body.set("metadata[agencyId]", agency._id);
    body.set("metadata[plan]", args.plan);
    body.set("metadata[clerkOrgId]", orgId);
    body.set("subscription_data[metadata][agencyId]", agency._id);
    body.set("subscription_data[metadata][plan]", args.plan);
    if (email) body.set("customer_email", email);

    // Reuse existing real Stripe customer when present
    const existing = await ctx.runQuery(internal.billing.getSubByAgencyInternal, {
      agencyId: agency._id,
    });
    if (
      existing?.stripeCustomerId &&
      !existing.stripeCustomerId.startsWith("cus_mock_")
    ) {
      body.set("customer", existing.stripeCustomerId);
      body.delete("customer_email");
    }

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    const json = (await res.json()) as {
      id?: string;
      url?: string;
      error?: { message?: string };
    };
    if (!res.ok || !json.url) {
      return {
        ok: false as const,
        error: json.error?.message ?? `Stripe Checkout HTTP ${res.status}`,
      };
    }
    return {
      ok: true as const,
      sessionId: json.id,
      url: json.url,
    };
  },
});

/** Stripe Customer Billing Portal for plan changes / payment method. */
export const createPortalSession = action({
  args: {
    returnUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const rec = identity as Record<string, unknown>;
    const orgId =
      (rec.org_id as string | undefined) ??
      (rec.orgId as string | undefined) ??
      ((rec.o as { id?: string } | undefined)?.id);
    if (!orgId) throw new Error("No active Agency organization");

    const secret = stripeSecret();
    if (!secret) {
      return { ok: false as const, error: "STRIPE_SECRET_KEY not configured" };
    }

    const agency = await ctx.runQuery(internal.billing.getAgencyByClerkOrgInternal, {
      clerkOrgId: orgId,
    });
    if (!agency) throw new Error("Agency not found");
    const existing = await ctx.runQuery(internal.billing.getSubByAgencyInternal, {
      agencyId: agency._id,
    });
    if (!existing?.stripeCustomerId || existing.stripeCustomerId.startsWith("cus_mock_")) {
      return { ok: false as const, error: "No Stripe customer — Checkout first" };
    }

    const appUrl = (process.env.MC_APP_URL ?? process.env.VITE_APP_URL ?? "http://127.0.0.1:5173").replace(
      /\/$/,
      "",
    );
    const body = new URLSearchParams();
    body.set("customer", existing.stripeCustomerId);
    body.set("return_url", args.returnUrl ?? `${appUrl}/app/settings`);

    const res = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    const json = (await res.json()) as {
      url?: string;
      error?: { message?: string };
    };
    if (!res.ok || !json.url) {
      return {
        ok: false as const,
        error: json.error?.message ?? `Stripe Portal HTTP ${res.status}`,
      };
    }
    return { ok: true as const, url: json.url };
  },
});

/** Internal: agency lookup for Checkout actions. */
export const getAgencyByClerkOrgInternal = internalQuery({
  args: { clerkOrgId: v.string() },
  handler: async (ctx, args) => {
    const agency = await getAgencyByClerkOrg(ctx, args.clerkOrgId);
    if (!agency) return null;
    return { _id: agency._id, name: agency.name, clerkOrgId: agency.clerkOrgId };
  },
});

export const getSubByAgencyInternal = internalQuery({
  args: { agencyId: v.id("agencies") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("subscriptions")
      .withIndex("by_agency", (q) => q.eq("agencyId", args.agencyId))
      .unique();
  },
});

/**
 * Apply verified Stripe webhook event (from HTTP route after signature check).
 */
export const applyStripeEvent = internalMutation({
  args: {
    type: v.string(),
    agencyId: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    plan: v.optional(
      v.union(v.literal("starter"), v.literal("pro"), v.literal("enterprise")),
    ),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("past_due"),
        v.literal("canceled"),
        v.literal("trialing"),
      ),
    ),
    currentPeriodEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (
      !args.agencyId ||
      !args.stripeCustomerId ||
      !args.stripeSubscriptionId ||
      !args.plan ||
      !args.status ||
      args.currentPeriodEnd == null
    ) {
      return { ok: false as const, reason: "incomplete_payload" as const };
    }

    const agency = await ctx.db.get(args.agencyId as Id<"agencies">);
    if (!agency) return { ok: false as const, reason: "agency_not_found" as const };

    const byStripe = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripeSub", (q) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId!),
      )
      .unique();
    if (byStripe) {
      await ctx.db.patch(byStripe._id, {
        plan: args.plan,
        status: args.status,
        currentPeriodEnd: args.currentPeriodEnd,
        stripeCustomerId: args.stripeCustomerId,
      });
    } else {
      const byAgency = await ctx.db
        .query("subscriptions")
        .withIndex("by_agency", (q) => q.eq("agencyId", agency._id))
        .unique();
      if (byAgency) {
        await ctx.db.patch(byAgency._id, {
          stripeCustomerId: args.stripeCustomerId,
          stripeSubscriptionId: args.stripeSubscriptionId,
          plan: args.plan,
          status: args.status,
          currentPeriodEnd: args.currentPeriodEnd,
        });
      } else {
        await ctx.db.insert("subscriptions", {
          agencyId: agency._id,
          stripeCustomerId: args.stripeCustomerId,
          stripeSubscriptionId: args.stripeSubscriptionId,
          plan: args.plan,
          status: args.status,
          currentPeriodEnd: args.currentPeriodEnd,
        });
      }
    }

    await ctx.db.insert("activityEvents", {
      agencyId: agency._id,
      kind: `billing.${args.type}`,
      message: `Stripe ${args.type}: ${args.plan} → ${args.status}`,
      entityType: "subscriptions",
      entityId: args.stripeSubscriptionId,
      createdAt: Date.now(),
    });

    return { ok: true as const };
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
