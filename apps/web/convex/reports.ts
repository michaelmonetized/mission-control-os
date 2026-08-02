import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAgencyByClerkOrg, requireAgencyOrg } from "./lib/auth";

/**
 * Audit report snapshots for export / portal (DSD open Q print/PDF later).
 * Stores a JSON summary of a crawl run for shareable history.
 */

export const saveSnapshot = mutation({
  args: {
    crawlRunId: v.id("crawlRuns"),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");

    const run = await ctx.db.get(args.crawlRunId);
    if (!run) throw new Error("run not found");
    const site = await ctx.db.get(run.siteId);
    if (!site) throw new Error("site not found");
    const loc = await ctx.db.get(site.locationId);
    if (!loc) throw new Error("location not found");
    const client = await ctx.db.get(loc.clientId);
    if (!client || client.agencyId !== agency._id) throw new Error("not in agency");

    const findings = await ctx.db
      .query("auditFindings")
      .withIndex("by_run", (q) => q.eq("crawlRunId", args.crawlRunId))
      .collect();

    const byType: Record<string, number> = {};
    for (const f of findings) {
      byType[f.type] = (byType[f.type] ?? 0) + 1;
    }

    const metrics = await ctx.db
      .query("metricsSnapshots")
      .withIndex("by_site", (q) => q.eq("siteId", run.siteId))
      .collect();
    const last = metrics
      .filter((m) => m.crawlRunId === args.crawlRunId)
      .sort((a, b) => b.completedAt - a.completedAt)[0];

    // Store as social-less report via automations? Use a lightweight approach:
    // encode in a task note is wrong — use openIssues table? Better add reports table.
    // For schema stability without migration pain, put summary on a new optional path.
    // We'll insert into a synthetic storage: use agentTokens? No.
    // Use existing pattern: write to metrics message via new table only if we add schema.

    // Add to schema reports table via this file expecting schema update
    const reportId = await ctx.db.insert("auditReports", {
      agencyId: agency._id,
      clientId: client._id,
      siteId: run.siteId,
      crawlRunId: args.crawlRunId,
      title: args.title ?? `Audit ${site.origin} ${new Date().toISOString().slice(0, 10)}`,
      summary: {
        origin: site.origin,
        status: run.status,
        mode: run.mode,
        findingCount: findings.length,
        byType,
        metrics: last
          ? {
              brokenLinks: last.brokenLinks,
              missingAlt: last.missingAlt,
              pagesRetrieved: last.pagesRetrieved,
              duplicatePercent: last.duplicatePercent,
            }
          : null,
      },
      createdAt: Date.now(),
    });

    return { reportId, findingCount: findings.length, byType };
  },
});

export const list = query({
  args: { clientId: v.optional(v.id("clients")) },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) return [];
    const rows = await ctx.db
      .query("auditReports")
      .withIndex("by_agency", (q) => q.eq("agencyId", agency._id))
      .collect();
    return rows
      .filter((r) => (args.clientId ? r.clientId === args.clientId : true))
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((r) => ({
        id: r._id,
        title: r.title,
        clientId: r.clientId,
        siteId: r.siteId,
        crawlRunId: r.crawlRunId,
        summary: r.summary,
        createdAt: r.createdAt,
      }));
  },
});
