import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAgencyByClerkOrg, requireAgencyOrg } from "./lib/auth";

/** Connected Accounts — Agency or Client owned (ADR-0039). */

export const list = query({
  args: {
    clientId: v.optional(v.id("clients")),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) return [];
    const rows = await ctx.db
      .query("connectedAccounts")
      .withIndex("by_agency", (q) => q.eq("agencyId", agency._id))
      .collect();
    return rows
      .filter((r) =>
        args.clientId
          ? r.clientId === args.clientId
          : true,
      )
      .map((r) => ({
        id: r._id,
        provider: r.provider,
        ownerKind: r.ownerKind,
        externalId: r.externalId,
        clientId: r.clientId,
      }));
  },
});

export const connect = mutation({
  args: {
    provider: v.string(),
    ownerKind: v.union(v.literal("agency"), v.literal("client")),
    clientId: v.optional(v.id("clients")),
    externalId: v.string(),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId, isAdmin } = await requireAgencyOrg(ctx);
    if (!isAdmin) throw new Error("Admin role required to connect accounts");
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");
    if (args.ownerKind === "client") {
      if (!args.clientId) throw new Error("clientId required for client-owned account");
      const client = await ctx.db.get(args.clientId);
      if (!client || client.agencyId !== agency._id) throw new Error("client not found");
    }
    const id = await ctx.db.insert("connectedAccounts", {
      agencyId: agency._id,
      clientId: args.ownerKind === "client" ? args.clientId : undefined,
      provider: args.provider.trim().toLowerCase(),
      ownerKind: args.ownerKind,
      externalId: args.externalId.trim(),
    });
    return { id };
  },
});

export const disconnect = mutation({
  args: { accountId: v.id("connectedAccounts") },
  handler: async (ctx, args) => {
    const { clerkOrgId, isAdmin } = await requireAgencyOrg(ctx);
    if (!isAdmin) throw new Error("Admin role required");
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");
    const row = await ctx.db.get(args.accountId);
    if (!row || row.agencyId !== agency._id) throw new Error("not found");
    await ctx.db.delete(args.accountId);
    return { ok: true };
  },
});
