import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAgencyByClerkOrg, requireAgencyOrg } from "./lib/auth";

async function assertSiteInAgency(
  ctx: Parameters<typeof requireAgencyOrg>[0],
  siteId: import("./_generated/dataModel").Id<"sites">,
  agencyId: import("./_generated/dataModel").Id<"agencies">,
) {
  const site = await ctx.db.get(siteId);
  if (!site) return null;
  const location = await ctx.db.get(site.locationId);
  if (!location) return null;
  const client = await ctx.db.get(location.clientId);
  if (!client || client.agencyId !== agencyId) return null;
  return { site, location, client };
}

export const listRuns = query({
  args: { siteId: v.id("sites") },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) return [];
    const scoped = await assertSiteInAgency(ctx, args.siteId, agency._id);
    if (!scoped) return [];
    return ctx.db
      .query("crawlRuns")
      .withIndex("by_site", (q) => q.eq("siteId", args.siteId))
      .collect();
  },
});

/** Queue a crawl run — Agent daemon executes (ADR-0004). */
export const queueRun = mutation({
  args: {
    siteId: v.id("sites"),
    mode: v.optional(v.string()),
    ignoreRobots: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");
    const scoped = await assertSiteInAgency(ctx, args.siteId, agency._id);
    if (!scoped) throw new Error("site not found");

    const crawlRunId = await ctx.db.insert("crawlRuns", {
      siteId: args.siteId,
      status: "queued",
      mode: args.mode ?? "rendered",
      ignoreRobots: Boolean(args.ignoreRobots),
      startedAt: Date.now(),
    });

    return {
      crawlRunId,
      siteId: args.siteId,
      mode: args.mode ?? "rendered",
      ignoreRobots: Boolean(args.ignoreRobots),
      status: "queued",
    };
  },
});

async function assertRunInAgency(
  ctx: Parameters<typeof requireAgencyOrg>[0],
  crawlRunId: import("./_generated/dataModel").Id<"crawlRuns">,
  agencyId: import("./_generated/dataModel").Id<"agencies">,
) {
  const run = await ctx.db.get(crawlRunId);
  if (!run) return null;
  const scoped = await assertSiteInAgency(ctx, run.siteId, agencyId);
  if (!scoped) return null;
  return { run, ...scoped };
}

/** Agent (or control plane) streams findings into Convex (ADR-0019). */
export const streamFinding = mutation({
  args: {
    crawlRunId: v.id("crawlRuns"),
    type: v.string(),
    severity: v.string(),
    url: v.string(),
    message: v.optional(v.string()),
    shared: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Agent auth later via agent token; for now require signed-in agency staff
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");
    const scoped = await assertRunInAgency(ctx, args.crawlRunId, agency._id);
    if (!scoped) throw new Error("crawl run not found");

    const findingId = await ctx.db.insert("auditFindings", {
      crawlRunId: args.crawlRunId,
      type: args.type,
      severity: args.severity,
      url: args.url,
      status: "open",
      shared: args.shared ?? false,
      message: args.message,
    });
    return { findingId };
  },
});

export const completeRun = mutation({
  args: {
    crawlRunId: v.id("crawlRuns"),
    metrics: v.object({
      brokenLinks: v.number(),
      missingAlt: v.number(),
      duplicatePercent: v.number(),
      pagesRetrieved: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");
    const scoped = await assertRunInAgency(ctx, args.crawlRunId, agency._id);
    if (!scoped) throw new Error("crawl run not found");
    const completedAt = Date.now();
    await ctx.db.patch(args.crawlRunId, {
      status: "completed",
      completedAt,
    });
    await ctx.db.insert("metricsSnapshots", {
      crawlRunId: args.crawlRunId,
      siteId: scoped.run.siteId,
      completedAt,
      ...args.metrics,
    });
    return { ok: true, completedAt };
  },
});

export const findingsForRun = query({
  args: { crawlRunId: v.id("crawlRuns") },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) return [];
    const scoped = await assertRunInAgency(ctx, args.crawlRunId, agency._id);
    if (!scoped) return [];
    return ctx.db
      .query("auditFindings")
      .withIndex("by_run", (q) => q.eq("crawlRunId", args.crawlRunId))
      .collect();
  },
});

export const metricsForSite = query({
  args: { siteId: v.id("sites") },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) return [];
    const scoped = await assertSiteInAgency(ctx, args.siteId, agency._id);
    if (!scoped) return [];
    return ctx.db
      .query("metricsSnapshots")
      .withIndex("by_site", (q) => q.eq("siteId", args.siteId))
      .collect();
  },
});
