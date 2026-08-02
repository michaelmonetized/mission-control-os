import type { QueryCtx, MutationCtx } from "../_generated/server";

type AuthCtx = QueryCtx | MutationCtx;

/** Require signed-in Clerk user. */
export async function requireUser(ctx: AuthCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthenticated");
  }
  return identity;
}

/** Clerk JWT may expose org as org_id (template) or nested claims. */
export function orgClaims(identity: Record<string, unknown>) {
  const orgId =
    (identity.org_id as string | undefined) ??
    (identity.orgId as string | undefined) ??
    ((identity.o as { id?: string } | undefined)?.id);
  const orgRole =
    (identity.org_role as string | undefined) ??
    (identity.orgRole as string | undefined) ??
    ((identity.o as { rol?: string } | undefined)?.rol);
  const orgName =
    (identity.org_name as string | undefined) ??
    (identity.orgName as string | undefined);
  return { orgId, orgRole, orgName };
}

/**
 * Agency staff: active Clerk Organization = Agency (ADR-0015).
 * Client portal users have no orgId — use portal grants instead (ADR-0026).
 */
export async function requireAgencyOrg(ctx: AuthCtx) {
  const identity = await requireUser(ctx);
  const { orgId, orgRole, orgName } = orgClaims(identity as Record<string, unknown>);
  if (!orgId) {
    throw new Error("No active Agency organization — create or select an org");
  }
  return {
    identity,
    clerkOrgId: orgId,
    orgRole: orgRole ?? "org:member",
    orgName,
    isAdmin: orgRole === "org:admin" || orgRole === "admin",
  };
}

export async function getAgencyByClerkOrg(ctx: AuthCtx, clerkOrgId: string) {
  return ctx.db
    .query("agencies")
    .withIndex("by_clerkOrg", (q) => q.eq("clerkOrgId", clerkOrgId))
    .unique();
}
