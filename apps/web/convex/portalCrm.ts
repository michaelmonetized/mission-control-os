import { v } from "convex/values";
import { query } from "./_generated/server";

/** Client portal CRM read (ADR-0028/0032) — grant-scoped contacts only. */

export const listContacts = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const rec = identity as Record<string, unknown>;
    const email = (rec.email as string | undefined)?.toLowerCase();
    const byUser = await ctx.db
      .query("portalGrants")
      .withIndex("by_clerkUser", (q) => q.eq("clerkUserId", identity.subject))
      .collect();
    const byEmail = email
      ? await ctx.db
          .query("portalGrants")
          .withIndex("by_email", (q) => q.eq("email", email))
          .collect()
      : [];
    const grant = [...byUser, ...byEmail].find((g) => g.clientId === args.clientId);
    if (!grant) return [];

    const client = await ctx.db.get(args.clientId);
    if (!client) return [];

    const workspaces = await ctx.db
      .query("crmWorkspaces")
      .withIndex("by_agency", (q) => q.eq("agencyId", client.agencyId))
      .collect();
    const ws = workspaces.find((w) => w.kind === "client" && w.clientId === args.clientId);
    if (!ws) return [];

    const rows = await ctx.db
      .query("contacts")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", ws._id))
      .collect();
    return rows.map((c) => ({
      id: c._id,
      name: c.name,
      email: c.email,
      status: c.status,
    }));
  },
});
