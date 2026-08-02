import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAgencyByClerkOrg, requireAgencyOrg, requireUser } from "./lib/auth";

function hashToken(token: string): string {
  // Lightweight non-crypto fingerprint for storage (daemon holds raw refresh)
  let h = 0;
  for (let i = 0; i < token.length; i++) {
    h = (Math.imul(31, h) + token.charCodeAt(i)) | 0;
  }
  return `h${(h >>> 0).toString(16)}`;
}

/** Issue long-lived Agent refresh token for Desktop to store (ADR-0016). */
export const issueToken = mutation({
  args: {
    deviceLabel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId, identity } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");

    const refreshToken = `mc_agent_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
    const refreshHash = hashToken(refreshToken);

    // Revoke previous tokens for this user+agency (single active device simplify)
    const existing = await ctx.db
      .query("agentTokens")
      .withIndex("by_user", (q) => q.eq("clerkUserId", identity.subject))
      .collect();
    for (const t of existing) {
      if (t.agencyId === agency._id) {
        await ctx.db.delete(t._id);
      }
    }

    await ctx.db.insert("agentTokens", {
      clerkUserId: identity.subject,
      agencyId: agency._id,
      refreshHash,
      deviceLabel: args.deviceLabel ?? "desktop",
    });

    return {
      refreshToken,
      agencyId: agency._id,
      expiresIn: 60 * 60 * 24 * 90, // 90d policy hint
      tokenType: "agent_refresh",
    };
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const rows = await ctx.db
      .query("agentTokens")
      .withIndex("by_user", (q) => q.eq("clerkUserId", identity.subject))
      .collect();
    return rows.map((t) => ({
      id: t._id,
      agencyId: t.agencyId,
      deviceLabel: t.deviceLabel,
      refreshHash: t.refreshHash,
    }));
  },
});

export const revoke = mutation({
  args: { tokenId: v.optional(v.id("agentTokens")) },
  handler: async (ctx, args) => {
    const identity = await requireUser(ctx);
    if (args.tokenId) {
      const row = await ctx.db.get(args.tokenId);
      if (row && row.clerkUserId === identity.subject) {
        await ctx.db.delete(args.tokenId);
      }
      return { ok: true };
    }
    const rows = await ctx.db
      .query("agentTokens")
      .withIndex("by_user", (q) => q.eq("clerkUserId", identity.subject))
      .collect();
    for (const t of rows) await ctx.db.delete(t._id);
    return { ok: true, revoked: rows.length };
  },
});
