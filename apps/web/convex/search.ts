import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAgencyByClerkOrg, requireAgencyOrg } from "./lib/auth";

/** Global agency search for palette / quick jump. */
export const agencySearch = query({
  args: { q: v.string() },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) return { clients: [], tasks: [], contacts: [], opportunities: [] };
    const q = args.q.trim().toLowerCase();
    if (q.length < 1) return { clients: [], tasks: [], contacts: [], opportunities: [] };

    const clients = await ctx.db
      .query("clients")
      .withIndex("by_agency", (idx) => idx.eq("agencyId", agency._id))
      .collect();
    const clientHits = clients
      .filter((c) => c.name.toLowerCase().includes(q) || (c.domain ?? "").toLowerCase().includes(q))
      .slice(0, 8)
      .map((c) => ({ id: c._id, name: c.name, domain: c.domain, isSelf: c.isSelf }));

    const clientIds = new Set(clients.map((c) => c._id));
    const allTasks = await ctx.db.query("tasks").collect();
    const taskHits = allTasks
      .filter(
        (t) =>
          t.title.toLowerCase().includes(q) &&
          ((t.clientId && clientIds.has(t.clientId)) || t.workspaceId),
      )
      .slice(0, 8)
      .map((t) => ({ id: t._id, title: t.title, status: t.status }));

    const workspaces = await ctx.db
      .query("crmWorkspaces")
      .withIndex("by_agency", (idx) => idx.eq("agencyId", agency._id))
      .collect();
    const wsIds = new Set(workspaces.map((w) => w._id));
    const contactHits: { id: string; name: string; email?: string }[] = [];
    for (const ws of workspaces) {
      if (contactHits.length >= 8) break;
      const contacts = await ctx.db
        .query("contacts")
        .withIndex("by_workspace", (idx) => idx.eq("workspaceId", ws._id))
        .collect();
      for (const c of contacts) {
        if (
          c.name.toLowerCase().includes(q) ||
          (c.email ?? "").toLowerCase().includes(q)
        ) {
          contactHits.push({ id: c._id, name: c.name, email: c.email });
          if (contactHits.length >= 8) break;
        }
      }
    }
    void wsIds;

    const oppHits: { id: string; name: string; stage: string }[] = [];
    for (const ws of workspaces) {
      if (oppHits.length >= 8) break;
      const opps = await ctx.db
        .query("opportunities")
        .withIndex("by_workspace", (idx) => idx.eq("workspaceId", ws._id))
        .collect();
      for (const o of opps) {
        if (o.name.toLowerCase().includes(q)) {
          oppHits.push({ id: o._id, name: o.name, stage: o.stage });
          if (oppHits.length >= 8) break;
        }
      }
    }

    return {
      clients: clientHits,
      tasks: taskHits,
      contacts: contactHits,
      opportunities: oppHits,
    };
  },
});
