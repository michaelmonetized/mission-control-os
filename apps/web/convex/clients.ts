import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAgencyByClerkOrg, requireAgencyOrg } from "./lib/auth";

export const list = query({
  args: {
    query: v.optional(v.string()),
    isSelf: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) return [];

    let rows = await ctx.db
      .query("clients")
      .withIndex("by_agency", (q) => q.eq("agencyId", agency._id))
      .collect();

    if (args.isSelf !== undefined) {
      rows = rows.filter((c) => c.isSelf === args.isSelf);
    }
    if (args.query) {
      const q = args.query.toLowerCase();
      rows = rows.filter((c) => c.name.toLowerCase().includes(q));
    }

    return rows.map((c) => ({
      id: c._id,
      name: c.name,
      isSelf: c.isSelf,
      domain: c.domain,
      agencyId: c.agencyId,
    }));
  },
});

export const add = mutation({
  args: {
    name: v.string(),
    domain: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found — complete onboarding first");

    const name = args.name.trim();
    if (!name) throw new Error("name required");

    const clientId = await ctx.db.insert("clients", {
      agencyId: agency._id,
      name,
      isSelf: false,
      domain: args.domain,
    });

    await ctx.db.insert("crmWorkspaces", {
      kind: "client",
      agencyId: agency._id,
      clientId,
    });

    const row = await ctx.db.get(clientId);
    return {
      id: clientId,
      name: row!.name,
      isSelf: row!.isSelf,
      domain: row!.domain,
    };
  },
});

export const update = mutation({
  args: {
    clientId: v.id("clients"),
    patch: v.object({
      name: v.optional(v.string()),
      domain: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");

    const client = await ctx.db.get(args.clientId);
    if (!client || client.agencyId !== agency._id) {
      throw new Error("client not found");
    }

    const patch: { name?: string; domain?: string } = {};
    if (args.patch.name !== undefined) patch.name = args.patch.name.trim();
    if (args.patch.domain !== undefined) patch.domain = args.patch.domain;
    await ctx.db.patch(args.clientId, patch);

    const row = await ctx.db.get(args.clientId);
    return {
      id: row!._id,
      name: row!.name,
      isSelf: row!.isSelf,
      domain: row!.domain,
    };
  },
});
