import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAgencyByClerkOrg, requireAgencyOrg, requireUser } from "./lib/auth";

/**
 * Client portal grants — Client Users are outside Agency Clerk Org (ADR-0026).
 * Authorization is Convex ACL only: invite binds userId/email → Client.
 */

export const listGrants = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) return [];

    const client = await ctx.db.get(args.clientId);
    if (!client || client.agencyId !== agency._id) return [];

    return ctx.db
      .query("portalGrants")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();
  },
});

export const invite = mutation({
  args: {
    clientId: v.id("clients"),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId, isAdmin } = await requireAgencyOrg(ctx);
    if (!isAdmin) throw new Error("Admin role required to invite portal users");

    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");

    const client = await ctx.db.get(args.clientId);
    if (!client || client.agencyId !== agency._id) {
      throw new Error("client not found");
    }

    const email = args.email.trim().toLowerCase();
    const grantId = await ctx.db.insert("portalGrants", {
      clientId: args.clientId,
      email,
      role: args.role,
    });

    // Allowlist entry for sign-in binding (ADR-0027)
    await ctx.db.insert("portalAllowlist", {
      clientId: args.clientId,
      email,
    });

    return { grantId, email, role: args.role };
  },
});

/**
 * Grants for the signed-in user (portal session).
 * Works without Agency org membership.
 */
export const myGrants = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const email = (identity.email as string | undefined)?.toLowerCase();
    const userId = identity.subject;

    const all = await ctx.db.query("portalGrants").collect();
    return all.filter(
      (g) => g.clerkUserId === userId || (email && g.email === email),
    );
  },
});

/** Bind signed-in Clerk user to matching allowlist/grant emails. */
export const claimInvite = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireUser(ctx);
    const email = (identity.email as string | undefined)?.toLowerCase();
    if (!email) throw new Error("User email required to claim portal invite");

    const grants = await ctx.db.query("portalGrants").collect();
    let claimed = 0;
    for (const g of grants) {
      if (g.email === email && !g.clerkUserId) {
        await ctx.db.patch(g._id, { clerkUserId: identity.subject });
        claimed++;
      }
    }
    return { claimed };
  },
});

export const listAllowlist = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) return [];
    const client = await ctx.db.get(args.clientId);
    if (!client || client.agencyId !== agency._id) return [];
    return ctx.db
      .query("portalAllowlist")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();
  },
});
