import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAgencyByClerkOrg, requireAgencyOrg } from "./lib/auth";
import type { Id } from "./_generated/dataModel";

const findingStatus = v.union(
  v.literal("open"),
  v.literal("triaged"),
  v.literal("in_progress"),
  v.literal("done"),
  v.literal("wont_fix"),
  v.literal("false_positive"),
);

async function assertRunInAgency(
  ctx: {
    db: {
      get: (id: any) => Promise<any>;
    };
  },
  crawlRunId: Id<"crawlRuns">,
  agencyId: Id<"agencies">,
) {
  const run = await ctx.db.get(crawlRunId);
  if (!run) return null;
  const site = await ctx.db.get(run.siteId);
  if (!site) return null;
  const location = await ctx.db.get(site.locationId);
  if (!location) return null;
  const client = await ctx.db.get(location.clientId);
  if (!client || client.agencyId !== agencyId) return null;
  return { run, site, location, client };
}

export const setStatus = mutation({
  args: {
    findingId: v.id("auditFindings"),
    status: findingStatus,
  },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");
    const finding = await ctx.db.get(args.findingId);
    if (!finding) throw new Error("finding not found");
    const scoped = await assertRunInAgency(ctx, finding.crawlRunId, agency._id);
    if (!scoped) throw new Error("finding not in agency");
    await ctx.db.patch(args.findingId, { status: args.status });
    return { id: args.findingId, status: args.status };
  },
});

export const setShared = mutation({
  args: {
    findingId: v.id("auditFindings"),
    shared: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");
    const finding = await ctx.db.get(args.findingId);
    if (!finding) throw new Error("finding not found");
    const scoped = await assertRunInAgency(ctx, finding.crawlRunId, agency._id);
    if (!scoped) throw new Error("finding not in agency");
    await ctx.db.patch(args.findingId, { shared: args.shared });
    return { id: args.findingId, shared: args.shared };
  },
});

/** Promote finding → delivery Task (open question default: on for high severity). */
export const createTaskFromFinding = mutation({
  args: {
    findingId: v.id("auditFindings"),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId, identity } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");
    const finding = await ctx.db.get(args.findingId);
    if (!finding) throw new Error("finding not found");
    const scoped = await assertRunInAgency(ctx, finding.crawlRunId, agency._id);
    if (!scoped) throw new Error("finding not in agency");

    const title = `[${finding.type}] ${finding.url}`.slice(0, 200);
    const taskId = await ctx.db.insert("tasks", {
      title,
      status: "todo",
      flags: ["delivery"],
      tags: ["audit", finding.severity],
      clientId: scoped.client._id,
      assigneeUserId: identity.subject,
    });
    return { taskId, title };
  },
});

/** Shared findings for portal (ADR-0028) — by client via site chain. */
export const sharedForClient = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    // Agency staff or portal grant — portal uses myGrants separately
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const client = await ctx.db.get(args.clientId);
    if (!client) return [];

    // Agency path
    const rec = identity as Record<string, unknown>;
    const orgId =
      (rec.org_id as string | undefined) ?? (rec.orgId as string | undefined);
    if (orgId) {
      const agency = await getAgencyByClerkOrg(ctx, orgId);
      if (!agency || client.agencyId !== agency._id) {
        // fall through to portal grant check
      } else {
        return collectShared(ctx, args.clientId);
      }
    }

    // Portal grant path
    const email = (rec.email as string | undefined)?.toLowerCase();
    const grants = await ctx.db
      .query("portalGrants")
      .withIndex("by_email", (q) => q.eq("email", email ?? ""))
      .collect();
    const ok =
      grants.some((g) => g.clientId === args.clientId) ||
      (
        await ctx.db
          .query("portalGrants")
          .withIndex("by_clerkUser", (q) => q.eq("clerkUserId", identity.subject))
          .collect()
      ).some((g) => g.clientId === args.clientId);
    if (!ok) return [];
    return collectShared(ctx, args.clientId);
  },
});

async function collectShared(
  ctx: { db: any },
  clientId: Id<"clients">,
) {
  const locations = await ctx.db
    .query("locations")
    .withIndex("by_client", (q: any) => q.eq("clientId", clientId))
    .collect();
  const findings: any[] = [];
  for (const loc of locations) {
    const sites = await ctx.db
      .query("sites")
      .withIndex("by_location", (q: any) => q.eq("locationId", loc._id))
      .collect();
    for (const site of sites) {
      const runs = await ctx.db
        .query("crawlRuns")
        .withIndex("by_site", (q: any) => q.eq("siteId", site._id))
        .collect();
      for (const run of runs) {
        const rows = await ctx.db
          .query("auditFindings")
          .withIndex("by_run", (q: any) => q.eq("crawlRunId", run._id))
          .collect();
        for (const f of rows) {
          if (f.shared) {
            findings.push({
              id: f._id,
              type: f.type,
              severity: f.severity,
              url: f.url,
              status: f.status,
              message: f.message,
              crawlRunId: run._id,
            });
          }
        }
      }
    }
  }
  return findings;
}
