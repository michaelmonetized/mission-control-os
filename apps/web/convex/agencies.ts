import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAgencyByClerkOrg, requireAgencyOrg, requireUser } from "./lib/auth";

/** Current Agency row for active Clerk org (creates nothing). */
export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const rec = identity as Record<string, unknown>;
    const orgId =
      (rec.org_id as string | undefined) ??
      (rec.orgId as string | undefined) ??
      ((rec.o as { id?: string } | undefined)?.id);
    if (!orgId) return null;
    return getAgencyByClerkOrg(ctx, orgId);
  },
});

/**
 * Ensure Agency exists for active Clerk Organization.
 * Also seeds Self Client + Agency CRM workspace (ADR-0040).
 */
export const ensureMine = mutation({
  args: {
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId, identity, orgName } = await requireAgencyOrg(ctx);
    const existing = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (existing) {
      if (args.name && args.name !== existing.name) {
        await ctx.db.patch(existing._id, { name: args.name });
        return { agencyId: existing._id, created: false };
      }
      return { agencyId: existing._id, created: false };
    }

    const name = args.name?.trim() || orgName || "My Agency";
    void identity;

    const agencyId = await ctx.db.insert("agencies", {
      clerkOrgId,
      name,
      onboardingStep: 0,
    });

    // Self Client — operator is first client (ADR-0040)
    const selfClientId = await ctx.db.insert("clients", {
      agencyId,
      name,
      isSelf: true,
    });

    // Agency CRM workspace
    await ctx.db.insert("crmWorkspaces", {
      kind: "agency",
      agencyId,
    });

    // Client CRM workspace for Self Client
    await ctx.db.insert("crmWorkspaces", {
      kind: "client",
      agencyId,
      clientId: selfClientId,
    });

    return { agencyId, created: true, selfClientId };
  },
});

export const setOnboardingStep = mutation({
  args: { step: v.number() },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found — run ensureMine first");
    await ctx.db.patch(agency._id, { onboardingStep: args.step });
    return { ok: true };
  },
});

/** Debug: current identity claims (no secrets). */
export const whoami = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { signedIn: false as const };
    const rec = identity as Record<string, unknown>;
    const orgId =
      (rec.org_id as string | undefined) ??
      (rec.orgId as string | undefined) ??
      null;
    const orgRole =
      (rec.org_role as string | undefined) ??
      (rec.orgRole as string | undefined) ??
      null;
    const orgName =
      (rec.org_name as string | undefined) ??
      (rec.orgName as string | undefined) ??
      null;
    return {
      signedIn: true as const,
      subject: identity.subject,
      email: (rec.email as string | undefined) ?? null,
      orgId,
      orgRole,
      orgName,
    };
  },
});
