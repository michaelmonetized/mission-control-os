import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAgencyByClerkOrg, requireAgencyOrg } from "./lib/auth";
import type { Id } from "./_generated/dataModel";

async function resolveWorkspace(
  ctx: { db: any },
  agencyId: Id<"agencies">,
  args: { workspaceId?: Id<"crmWorkspaces">; kind?: "agency" | "client"; clientId?: Id<"clients"> },
) {
  const workspaces = await ctx.db
    .query("crmWorkspaces")
    .withIndex("by_agency", (q: any) => q.eq("agencyId", agencyId))
    .collect();
  if (args.workspaceId) {
    const ws = workspaces.find((w: any) => w._id === args.workspaceId);
    if (!ws) throw new Error("workspace not found");
    return ws;
  }
  if (args.kind === "client" || args.clientId) {
    if (!args.clientId) throw new Error("clientId required");
    let ws = workspaces.find((w: any) => w.kind === "client" && w.clientId === args.clientId);
    if (!ws) {
      const id = await ctx.db.insert("crmWorkspaces", {
        kind: "client",
        agencyId,
        clientId: args.clientId,
      });
      return { _id: id, kind: "client", agencyId, clientId: args.clientId };
    }
    return ws;
  }
  const agencyWs = workspaces.find((w: any) => w.kind === "agency");
  if (!agencyWs) throw new Error("Agency CRM workspace missing");
  return agencyWs;
}

export const list = query({
  args: {
    workspaceId: v.optional(v.id("crmWorkspaces")),
    kind: v.optional(v.union(v.literal("agency"), v.literal("client"))),
    clientId: v.optional(v.id("clients")),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) return [];
    const ws = await resolveWorkspace(ctx, agency._id, args);
    const rows = await ctx.db
      .query("opportunities")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", ws._id))
      .collect();
    return rows.map((o) => ({
      id: o._id,
      name: o.name,
      stage: o.stage,
      value: o.value,
      workspaceId: o.workspaceId,
    }));
  },
});

export const listCompanies = query({
  args: {
    workspaceId: v.optional(v.id("crmWorkspaces")),
    kind: v.optional(v.union(v.literal("agency"), v.literal("client"))),
    clientId: v.optional(v.id("clients")),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) return [];
    const ws = await resolveWorkspace(ctx, agency._id, args);
    const rows = await ctx.db
      .query("companies")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", ws._id))
      .collect();
    return rows.map((c) => ({
      id: c._id,
      name: c.name,
      domain: c.domain,
      workspaceId: c.workspaceId,
    }));
  },
});

export const addCompany = mutation({
  args: {
    kind: v.optional(v.union(v.literal("agency"), v.literal("client"))),
    clientId: v.optional(v.id("clients")),
    name: v.string(),
    domain: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");
    const ws = await resolveWorkspace(ctx, agency._id, args);
    const id = await ctx.db.insert("companies", {
      workspaceId: ws._id,
      name: args.name.trim(),
      domain: args.domain?.trim(),
    });
    return { id };
  },
});

export const add = mutation({
  args: {
    kind: v.optional(v.union(v.literal("agency"), v.literal("client"))),
    clientId: v.optional(v.id("clients")),
    name: v.string(),
    stage: v.optional(v.string()),
    value: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");
    const ws = await resolveWorkspace(ctx, agency._id, args);
    const id = await ctx.db.insert("opportunities", {
      workspaceId: ws._id,
      name: args.name.trim(),
      stage: args.stage ?? "qualified",
      value: args.value,
    });
    return { id };
  },
});

export const setStage = mutation({
  args: {
    opportunityId: v.id("opportunities"),
    stage: v.string(),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");
    const opp = await ctx.db.get(args.opportunityId);
    if (!opp) throw new Error("not found");
    const ws = await ctx.db.get(opp.workspaceId);
    if (!ws || ws.agencyId !== agency._id) throw new Error("not found");
    await ctx.db.patch(args.opportunityId, { stage: args.stage });

    // Won deal → optionally create delivery Client (open question default: prompt via return)
    let createdClientId: Id<"clients"> | undefined;
    if (args.stage === "won" && ws.kind === "agency") {
      // Create linked delivery client from opportunity name if none self-named match
      const existing = await ctx.db
        .query("clients")
        .withIndex("by_agency", (q) => q.eq("agencyId", agency._id))
        .collect();
      const match = existing.find(
        (c) => c.name.toLowerCase() === opp.name.toLowerCase() && !c.isSelf,
      );
      if (!match) {
        createdClientId = await ctx.db.insert("clients", {
          agencyId: agency._id,
          name: opp.name,
          isSelf: false,
        });
        await ctx.db.insert("crmWorkspaces", {
          kind: "client",
          agencyId: agency._id,
          clientId: createdClientId,
        });
      } else {
        createdClientId = match._id;
      }
    }

    return { id: args.opportunityId, stage: args.stage, createdClientId };
  },
});
