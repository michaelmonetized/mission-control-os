import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { getAgencyByClerkOrg, requireAgencyOrg } from "./lib/auth";
import type { Id } from "./_generated/dataModel";

/**
 * Agent job queue (ADR-0004/0012).
 * Daemon claims queued crawlRuns and reports completion.
 */

export const listQueuedCrawls = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) return [];

    // Collect sites for agency clients, then queued runs
    const clients = await ctx.db
      .query("clients")
      .withIndex("by_agency", (q) => q.eq("agencyId", agency._id))
      .collect();
    const out: {
      crawlRunId: string;
      siteId: string;
      origin: string;
      mode: string;
      ignoreRobots: boolean;
      startedAt: number;
    }[] = [];

    for (const client of clients) {
      const locations = await ctx.db
        .query("locations")
        .withIndex("by_client", (q) => q.eq("clientId", client._id))
        .collect();
      for (const loc of locations) {
        const sites = await ctx.db
          .query("sites")
          .withIndex("by_location", (q) => q.eq("locationId", loc._id))
          .collect();
        for (const site of sites) {
          const runs = await ctx.db
            .query("crawlRuns")
            .withIndex("by_site", (q) => q.eq("siteId", site._id))
            .collect();
          for (const run of runs) {
            if (run.status === "queued") {
              out.push({
                crawlRunId: run._id,
                siteId: site._id,
                origin: site.origin,
                mode: run.mode,
                ignoreRobots: run.ignoreRobots,
                startedAt: run.startedAt,
              });
            }
          }
        }
      }
    }

    out.sort((a, b) => a.startedAt - b.startedAt);
    return out.slice(0, args.limit ?? 10);
  },
});

export const claimCrawl = mutation({
  args: { crawlRunId: v.id("crawlRuns") },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");
    const run = await ctx.db.get(args.crawlRunId);
    if (!run || run.status !== "queued") throw new Error("not claimable");
    const site = await ctx.db.get(run.siteId);
    if (!site) throw new Error("site missing");
    const loc = await ctx.db.get(site.locationId);
    if (!loc) throw new Error("location missing");
    const client = await ctx.db.get(loc.clientId);
    if (!client || client.agencyId !== agency._id) throw new Error("not in agency");
    await ctx.db.patch(args.crawlRunId, { status: "running" });
    return {
      crawlRunId: args.crawlRunId,
      origin: site.origin,
      mode: run.mode,
      ignoreRobots: run.ignoreRobots,
    };
  },
});

/** Internal: all queued crawls across agencies (agent HTTP with shared secret). */
async function agencyIdForSite(
  ctx: { db: any },
  siteId: Id<"sites">,
): Promise<Id<"agencies"> | null> {
  const site = await ctx.db.get(siteId);
  if (!site) return null;
  const loc = await ctx.db.get(site.locationId);
  if (!loc) return null;
  const client = await ctx.db.get(loc.clientId);
  if (!client) return null;
  return client.agencyId as Id<"agencies">;
}

export const listQueuedInternal = internalQuery({
  args: {
    limit: v.optional(v.number()),
    /** When set, only return jobs for this agency (tenant-bound agent). */
    agencyId: v.optional(v.id("agencies")),
  },
  handler: async (ctx, args) => {
    const runs = await ctx.db.query("crawlRuns").collect();
    const queued = runs.filter((r) => r.status === "queued");
    const out: {
      crawlRunId: Id<"crawlRuns">;
      siteId: Id<"sites">;
      agencyId: Id<"agencies"> | null;
      origin: string;
      mode: string;
      ignoreRobots: boolean;
      startedAt: number;
    }[] = [];
    for (const run of queued) {
      const site = await ctx.db.get(run.siteId);
      if (!site) continue;
      const agencyId = await agencyIdForSite(ctx, site._id);
      if (args.agencyId && agencyId !== args.agencyId) continue;
      out.push({
        crawlRunId: run._id,
        siteId: site._id,
        agencyId,
        origin: site.origin,
        mode: run.mode,
        ignoreRobots: run.ignoreRobots,
        startedAt: run.startedAt,
      });
    }
    out.sort((a, b) => a.startedAt - b.startedAt);
    return out.slice(0, args.limit ?? 10);
  },
});

export const claimInternal = internalMutation({
  args: {
    crawlRunId: v.id("crawlRuns"),
    agencyId: v.optional(v.id("agencies")),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.crawlRunId);
    if (!run || run.status !== "queued") throw new Error("not claimable");
    const site = await ctx.db.get(run.siteId);
    if (!site) throw new Error("site missing");
    const owner = await agencyIdForSite(ctx, site._id);
    if (args.agencyId && owner !== args.agencyId) {
      throw new Error("crawl run not in agency");
    }
    await ctx.db.patch(args.crawlRunId, { status: "running" });
    return {
      crawlRunId: args.crawlRunId,
      origin: site.origin,
      mode: run.mode,
      ignoreRobots: run.ignoreRobots,
      agencyId: owner,
    };
  },
});

export const streamFindingInternal = internalMutation({
  args: {
    crawlRunId: v.id("crawlRuns"),
    type: v.string(),
    severity: v.string(),
    url: v.string(),
    message: v.optional(v.string()),
    agencyId: v.optional(v.id("agencies")),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.crawlRunId);
    if (!run) throw new Error("crawl run not found");
    if (args.agencyId) {
      const owner = await agencyIdForSite(ctx, run.siteId);
      if (owner !== args.agencyId) throw new Error("crawl run not in agency");
    }
    const findingId = await ctx.db.insert("auditFindings", {
      crawlRunId: args.crawlRunId,
      type: args.type,
      severity: args.severity,
      url: args.url,
      status: "open",
      shared: false,
      message: args.message,
    });
    const fingerprint = `${args.type}|${args.url}|${args.message ?? ""}`.slice(0, 400);
    const existing = await ctx.db
      .query("openIssues")
      .withIndex("by_site_fingerprint", (q) =>
        q.eq("siteId", run.siteId).eq("fingerprint", fingerprint),
      )
      .unique();
    if (!existing) {
      await ctx.db.insert("openIssues", {
        siteId: run.siteId,
        fingerprint,
        type: args.type,
        url: args.url,
        status: "open",
        shared: false,
      });
    } else if (existing.status === "done" || existing.status === "wont_fix") {
      await ctx.db.patch(existing._id, { status: "open" });
    }
    return { findingId };
  },
});

export const completeInternal = internalMutation({
  args: {
    crawlRunId: v.id("crawlRuns"),
    metrics: v.object({
      brokenLinks: v.number(),
      missingAlt: v.number(),
      duplicatePercent: v.number(),
      pagesRetrieved: v.number(),
    }),
    structure: v.optional(
      v.object({
        origin: v.string(),
        maxDepth: v.number(),
        nodeCount: v.number(),
        edgeCount: v.number(),
        nodes: v.array(
          v.object({
            id: v.string(),
            url: v.string(),
            path: v.string(),
            depth: v.number(),
            title: v.optional(v.string()),
            outDegree: v.optional(v.number()),
          }),
        ),
        edges: v.array(v.object({ from: v.string(), to: v.string() })),
      }),
    ),
    agencyId: v.optional(v.id("agencies")),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.crawlRunId);
    if (!run) throw new Error("crawl run not found");
    if (args.agencyId) {
      const owner = await agencyIdForSite(ctx, run.siteId);
      if (owner !== args.agencyId) throw new Error("crawl run not in agency");
    }
    if (args.structure) {
      if (args.structure.nodes.length > 200) throw new Error("structure.nodes exceeds 200");
      if (args.structure.edges.length > 500) throw new Error("structure.edges exceeds 500");
    }
    const completedAt = Date.now();
    await ctx.db.patch(args.crawlRunId, { status: "completed", completedAt });
    await ctx.db.insert("metricsSnapshots", {
      crawlRunId: args.crawlRunId,
      siteId: run.siteId,
      completedAt,
      ...args.metrics,
    });
    if (args.structure) {
      await ctx.db.insert("siteStructures", {
        siteId: run.siteId,
        crawlRunId: args.crawlRunId,
        origin: args.structure.origin,
        nodes: args.structure.nodes,
        edges: args.structure.edges,
        maxDepth: args.structure.maxDepth,
        nodeCount: args.structure.nodeCount,
        edgeCount: args.structure.edgeCount,
        completedAt,
      });
    }
    return { ok: true, completedAt };
  },
});
