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

    await ctx.db.insert("activityEvents", {
      agencyId: agency._id,
      kind: "crawl.queued",
      message: `Crawl queued for site ${args.siteId}`,
      entityType: "crawlRuns",
      entityId: crawlRunId,
      createdAt: Date.now(),
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

    // Open Issue fingerprint across runs (ADR-0023 consequences)
    const fingerprint =
      `${args.type}|${args.url}|${args.message ?? ""}`.slice(0, 400);
    const existing = await ctx.db
      .query("openIssues")
      .withIndex("by_site_fingerprint", (q) =>
        q.eq("siteId", scoped.run.siteId).eq("fingerprint", fingerprint),
      )
      .unique();
    if (existing) {
      if (existing.status === "done" || existing.status === "wont_fix") {
        // re-open if seen again
        await ctx.db.patch(existing._id, { status: "open" });
      }
    } else {
      await ctx.db.insert("openIssues", {
        siteId: scoped.run.siteId,
        fingerprint,
        type: args.type,
        url: args.url,
        status: "open",
        shared: args.shared ?? false,
      });
    }

    return { findingId, fingerprint };
  },
});

const structureValidator = v.object({
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
    structure: v.optional(structureValidator),
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
    if (args.structure) {
      await ctx.db.insert("siteStructures", {
        siteId: scoped.run.siteId,
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

/** Site structure graph for a crawl run (ADR-0008). */
export const structureForRun = query({
  args: { crawlRunId: v.id("crawlRuns") },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) return null;
    const scoped = await assertRunInAgency(ctx, args.crawlRunId, agency._id);
    if (!scoped) return null;
    const row = await ctx.db
      .query("siteStructures")
      .withIndex("by_run", (q) => q.eq("crawlRunId", args.crawlRunId))
      .unique();
    if (!row) return null;
    return {
      origin: row.origin,
      maxDepth: row.maxDepth,
      nodeCount: row.nodeCount,
      edgeCount: row.edgeCount,
      nodes: row.nodes,
      edges: row.edges,
      completedAt: row.completedAt,
    };
  },
});

/**
 * Demo / fallback: build structure from finding URLs when Agent graph not streamed.
 */
export const structureFromFindings = query({
  args: { crawlRunId: v.id("crawlRuns") },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) return null;
    const scoped = await assertRunInAgency(ctx, args.crawlRunId, agency._id);
    if (!scoped) return null;

    // Prefer real structure
    const real = await ctx.db
      .query("siteStructures")
      .withIndex("by_run", (q) => q.eq("crawlRunId", args.crawlRunId))
      .unique();
    if (real) {
      return {
        source: "agent" as const,
        origin: real.origin,
        maxDepth: real.maxDepth,
        nodeCount: real.nodeCount,
        edgeCount: real.edgeCount,
        nodes: real.nodes,
        edges: real.edges,
      };
    }

    const findings = await ctx.db
      .query("auditFindings")
      .withIndex("by_run", (q) => q.eq("crawlRunId", args.crawlRunId))
      .collect();
    const site = scoped.site;
    const origin = site.origin.replace(/\/$/, "");
    const urlSet = new Set<string>([origin]);
    for (const f of findings) {
      try {
        const u = new URL(f.url, origin);
        if (u.origin === new URL(origin).origin) {
          const path = u.pathname.replace(/\/$/, "") || "";
          urlSet.add(`${u.origin}${path || ""}` || origin);
        }
      } catch {
        /* skip */
      }
    }
    const nodes = [...urlSet].slice(0, 80).map((url, i) => {
      let path = "/";
      try {
        path = new URL(url).pathname || "/";
      } catch {
        path = url.replace(origin, "") || "/";
      }
      const depth = path === "/" ? 0 : path.split("/").filter(Boolean).length;
      return {
        id: url,
        url,
        path,
        depth,
        title: undefined as string | undefined,
        outDegree: undefined as number | undefined,
      };
    });
    nodes.sort((a, b) => a.depth - b.depth || a.path.localeCompare(b.path));
    // Synthetic star edges from origin for viz
    const root = nodes.find((n) => n.depth === 0)?.id ?? origin;
    const edges = nodes
      .filter((n) => n.id !== root)
      .slice(0, 100)
      .map((n) => ({ from: root, to: n.id }));
    return {
      source: "findings_fallback" as const,
      origin,
      maxDepth: nodes.reduce((m, n) => Math.max(m, n.depth), 0),
      nodeCount: nodes.length,
      edgeCount: edges.length,
      nodes,
      edges,
    };
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

/**
 * Historical crawl run comparison (ADR-0008 Sitebulb + ADR-0024).
 * Returns latest two snapshots + deltas for the site.
 */
export const compareSnapshots = query({
  args: { siteId: v.id("sites") },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) return null;
    const scoped = await assertSiteInAgency(ctx, args.siteId, agency._id);
    if (!scoped) return null;
    const rows = await ctx.db
      .query("metricsSnapshots")
      .withIndex("by_site", (q) => q.eq("siteId", args.siteId))
      .collect();
    const sorted = rows.slice().sort((a, b) => b.completedAt - a.completedAt);
    const latest = sorted[0];
    const previous = sorted[1];
    if (!latest) return null;
    const delta = previous
      ? {
          brokenLinks: latest.brokenLinks - previous.brokenLinks,
          missingAlt: latest.missingAlt - previous.missingAlt,
          duplicatePercent: latest.duplicatePercent - previous.duplicatePercent,
          pagesRetrieved: latest.pagesRetrieved - previous.pagesRetrieved,
        }
      : null;
    return {
      latest: {
        crawlRunId: latest.crawlRunId,
        completedAt: latest.completedAt,
        brokenLinks: latest.brokenLinks,
        missingAlt: latest.missingAlt,
        duplicatePercent: latest.duplicatePercent,
        pagesRetrieved: latest.pagesRetrieved,
      },
      previous: previous
        ? {
            crawlRunId: previous.crawlRunId,
            completedAt: previous.completedAt,
            brokenLinks: previous.brokenLinks,
            missingAlt: previous.missingAlt,
            duplicatePercent: previous.duplicatePercent,
            pagesRetrieved: previous.pagesRetrieved,
          }
        : null,
      delta,
      improving:
        delta != null
          ? delta.brokenLinks <= 0 && delta.missingAlt <= 0
          : null,
    };
  },
});

/** Portal metrics — grant must cover site's client (ADR-0028). */
export const metricsForPortalSite = query({
  args: { siteId: v.id("sites") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const site = await ctx.db.get(args.siteId);
    if (!site) return [];
    const location = await ctx.db.get(site.locationId);
    if (!location) return [];
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
    const ok = [...byUser, ...byEmail].some((g) => g.clientId === location.clientId);
    if (!ok) return [];
    return ctx.db
      .query("metricsSnapshots")
      .withIndex("by_site", (q) => q.eq("siteId", args.siteId))
      .collect();
  },
});
