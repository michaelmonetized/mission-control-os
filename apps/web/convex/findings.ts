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

export const listOpenIssues = query({
  args: { siteId: v.id("sites") },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) return [];
    const site = await ctx.db.get(args.siteId);
    if (!site) return [];
    const location = await ctx.db.get(site.locationId);
    if (!location) return [];
    const client = await ctx.db.get(location.clientId);
    if (!client || client.agencyId !== agency._id) return [];
    const rows = await ctx.db
      .query("openIssues")
      .withIndex("by_site", (q) => q.eq("siteId", args.siteId))
      .collect();
    return rows.map((r) => ({
      id: r._id,
      fingerprint: r.fingerprint,
      type: r.type,
      url: r.url,
      status: r.status,
      shared: r.shared,
    }));
  },
});

const SEVERITY_WEIGHT: Record<string, number> = {
  critical: 100,
  high: 40,
  medium: 10,
  low: 3,
  info: 1,
};

/**
 * Sitebulb-class issue clustering for a crawl run (ADR-0008).
 * Groups findings by type with count + max severity.
 */
export const clusterForRun = query({
  args: { crawlRunId: v.id("crawlRuns") },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) return [];
    const scoped = await assertRunInAgency(ctx, args.crawlRunId, agency._id);
    if (!scoped) return [];
    const rows = await ctx.db
      .query("auditFindings")
      .withIndex("by_run", (q) => q.eq("crawlRunId", args.crawlRunId))
      .collect();

    const map = new Map<
      string,
      { type: string; count: number; severities: Record<string, number>; sampleUrl: string }
    >();
    for (const f of rows) {
      const cur = map.get(f.type) ?? {
        type: f.type,
        count: 0,
        severities: {},
        sampleUrl: f.url,
      };
      cur.count += 1;
      cur.severities[f.severity] = (cur.severities[f.severity] ?? 0) + 1;
      map.set(f.type, cur);
    }

    return [...map.values()]
      .map((c) => {
        const maxSev =
          (["critical", "high", "medium", "low", "info"] as const).find(
            (s) => (c.severities[s] ?? 0) > 0,
          ) ?? "low";
        const priority =
          (SEVERITY_WEIGHT[maxSev] ?? 1) * Math.log2(c.count + 1);
        return {
          type: c.type,
          count: c.count,
          maxSeverity: maxSev,
          severities: c.severities,
          sampleUrl: c.sampleUrl,
          priority: Math.round(priority * 10) / 10,
        };
      })
      .sort((a, b) => b.priority - a.priority);
  },
});

/**
 * Prioritised “fix next” list across open issues for a site (ADR-0008 Sitebulb insight).
 */
export const fixNext = query({
  args: { siteId: v.id("sites"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) return [];
    const site = await ctx.db.get(args.siteId);
    if (!site) return [];
    const location = await ctx.db.get(site.locationId);
    if (!location) return [];
    const client = await ctx.db.get(location.clientId);
    if (!client || client.agencyId !== agency._id) return [];

    const issues = await ctx.db
      .query("openIssues")
      .withIndex("by_site", (q) => q.eq("siteId", args.siteId))
      .collect();

    const open = issues.filter(
      (i) => i.status === "open" || i.status === "triaged" || i.status === "in_progress",
    );

    // Prefer high-impact types (heuristic weights; matches agent severity catalog)
    const TYPE_WEIGHT: Record<string, number> = {
      broken_link: 40,
      noindex: 35,
      missing_h1: 20,
      multiple_h1: 15,
      missing_title: 25,
      duplicate_title: 22,
      missing_alt: 12,
      thin_content: 14,
      missing_meta_description: 10,
      canonical_off_origin: 28,
      mixed_content: 30,
      missing_structured_data: 8,
      missing_hreflang: 6,
      large_image_no_dimensions: 9,
      render_blocking_script: 11,
      missing_lazy_loading: 5,
      cwv_lcp_poor: 45,
      cwv_cls_poor: 42,
      cwv_ttfb_slow: 18,
      cwv_fcp_poor: 20,
      cwv_lcp_needs_improvement: 25,
      cwv_cls_needs_improvement: 22,
    };

    const byType = new Map<string, { type: string; count: number; sampleUrl: string }>();
    for (const i of open) {
      const cur = byType.get(i.type) ?? { type: i.type, count: 0, sampleUrl: i.url };
      cur.count += 1;
      byType.set(i.type, cur);
    }

    return [...byType.values()]
      .map((c) => ({
        type: c.type,
        count: c.count,
        sampleUrl: c.sampleUrl,
        score: (TYPE_WEIGHT[c.type] ?? 5) * Math.log2(c.count + 1),
        why: `Fix ${c.count}× ${c.type.replace(/_/g, " ")} next for biggest SEO/a11y lift`,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, args.limit ?? 8);
  },
});

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

export const bulkSetStatus = mutation({
  args: {
    findingIds: v.array(v.id("auditFindings")),
    status: findingStatus,
  },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");
    let updated = 0;
    for (const findingId of args.findingIds.slice(0, 100)) {
      const finding = await ctx.db.get(findingId);
      if (!finding) continue;
      const scoped = await assertRunInAgency(ctx, finding.crawlRunId, agency._id);
      if (!scoped) continue;
      await ctx.db.patch(findingId, { status: args.status });
      updated++;
    }
    return { updated, status: args.status };
  },
});

export const bulkSetShared = mutation({
  args: {
    findingIds: v.array(v.id("auditFindings")),
    shared: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");
    let updated = 0;
    for (const id of args.findingIds.slice(0, 100)) {
      const finding = await ctx.db.get(id);
      if (!finding) continue;
      const scoped = await assertRunInAgency(ctx, finding.crawlRunId, agency._id);
      if (!scoped) continue;
      await ctx.db.patch(id, { shared: args.shared });
      updated += 1;
    }
    return { updated };
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
