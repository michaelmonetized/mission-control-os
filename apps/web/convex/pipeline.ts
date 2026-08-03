import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAgencyByClerkOrg, requireAgencyOrg } from "./lib/auth";
import type { Id } from "./_generated/dataModel";

const STAGES = ["qualified", "proposal", "negotiation", "won", "lost"] as const;

/** Pipeline board data for Agency or Client CRM (ADR-0032). */
export const board = query({
  args: {
    kind: v.optional(v.union(v.literal("agency"), v.literal("client"))),
    clientId: v.optional(v.id("clients")),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) return { stages: [...STAGES], columns: {} as Record<string, unknown[]> };

    const workspaces = await ctx.db
      .query("crmWorkspaces")
      .withIndex("by_agency", (q) => q.eq("agencyId", agency._id))
      .collect();

    let wsId: Id<"crmWorkspaces"> | undefined;
    if (args.kind === "client" && args.clientId) {
      const ws = workspaces.find((w) => w.kind === "client" && w.clientId === args.clientId);
      wsId = ws?._id;
    } else {
      wsId = workspaces.find((w) => w.kind === "agency")?._id;
    }
    if (!wsId) return { stages: [...STAGES], columns: Object.fromEntries(STAGES.map((s) => [s, []])) };

    const opps = await ctx.db
      .query("opportunities")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", wsId!))
      .collect();

    const columns: Record<string, { id: string; name: string; value?: number; stage: string }[]> =
      {};
    for (const s of STAGES) columns[s] = [];
    for (const o of opps) {
      const stage = STAGES.includes(o.stage as (typeof STAGES)[number]) ? o.stage : "qualified";
      columns[stage]!.push({
        id: o._id,
        name: o.name,
        value: o.value,
        stage,
      });
    }
    return { stages: [...STAGES], columns };
  },
});
