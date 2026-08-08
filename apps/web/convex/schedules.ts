import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { getAgencyByClerkOrg, requireAgencyOrg } from "./lib/auth";
import type { Id } from "./_generated/dataModel";

/**
 * Scheduled crawl runs when Agent is online (ADR-0008 agency ops).
 */

async function assertSiteInAgency(
  ctx: { db: any },
  siteId: Id<"sites">,
  agencyId: Id<"agencies">,
) {
  const site = await ctx.db.get(siteId);
  if (!site) return null;
  const location = await ctx.db.get(site.locationId);
  if (!location) return null;
  const client = await ctx.db.get(location.clientId);
  if (!client || client.agencyId !== agencyId) return null;
  return { site, location, client };
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) return [];
    const rows = await ctx.db
      .query("crawlSchedules")
      .withIndex("by_agency", (q) => q.eq("agencyId", agency._id))
      .collect();
    return rows.map((r) => ({
      id: r._id,
      siteId: r.siteId,
      intervalHours: r.intervalHours,
      mode: r.mode,
      ignoreRobots: r.ignoreRobots,
      enabled: r.enabled,
      nextRunAt: r.nextRunAt,
      lastQueuedAt: r.lastQueuedAt,
    }));
  },
});

export const upsert = mutation({
  args: {
    siteId: v.id("sites"),
    intervalHours: v.number(),
    mode: v.optional(v.string()),
    ignoreRobots: v.optional(v.boolean()),
    enabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");
    const scoped = await assertSiteInAgency(ctx, args.siteId, agency._id);
    if (!scoped) throw new Error("site not found");

    const intervalHours = Math.max(1, Math.min(args.intervalHours, 24 * 30));
    const existing = await ctx.db
      .query("crawlSchedules")
      .withIndex("by_site", (q) => q.eq("siteId", args.siteId))
      .unique();

    const nextRunAt = Date.now() + intervalHours * 3600_000;
    if (existing) {
      if (existing.agencyId !== agency._id) throw new Error("not found");
      await ctx.db.patch(existing._id, {
        intervalHours,
        mode: args.mode ?? existing.mode,
        ignoreRobots: args.ignoreRobots ?? existing.ignoreRobots,
        enabled: args.enabled ?? existing.enabled,
        nextRunAt,
      });
      return { id: existing._id, nextRunAt };
    }

    const id = await ctx.db.insert("crawlSchedules", {
      agencyId: agency._id,
      siteId: args.siteId,
      intervalHours,
      mode: args.mode ?? "rendered",
      ignoreRobots: Boolean(args.ignoreRobots),
      enabled: args.enabled ?? true,
      nextRunAt,
    });
    return { id, nextRunAt };
  },
});

export const remove = mutation({
  args: { scheduleId: v.id("crawlSchedules") },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");
    const row = await ctx.db.get(args.scheduleId);
    if (!row || row.agencyId !== agency._id) throw new Error("not found");
    await ctx.db.delete(args.scheduleId);
    return { ok: true };
  },
});

/** How recently an agent heartbeated for this agency (UI badge). */
export const agentOnline = query({
  args: {},
  handler: async (ctx) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) return { online: false, lastSeenAt: null as number | null };
    const rows = await ctx.db
      .query("agentPresence")
      .withIndex("by_agency", (q) => q.eq("agencyId", agency._id))
      .collect();
    if (rows.length === 0) return { online: false, lastSeenAt: null as number | null };
    const lastSeenAt = Math.max(...rows.map((r) => r.lastSeenAt));
    // Online if seen in last 5 minutes
    const online = Date.now() - lastSeenAt < 5 * 60_000;
    return { online, lastSeenAt };
  },
});

/**
 * Internal: tick due schedules when agency has recent agent presence.
 * Called by cron every 15m.
 */
export const tickDue = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const ONLINE_MS = 10 * 60_000;
    // Prefer by_next index: due rows are those with nextRunAt <= now
    const candidates = await ctx.db
      .query("crawlSchedules")
      .withIndex("by_next", (q) => q.lte("nextRunAt", now))
      .take(50);
    const due = candidates.filter((s) => s.enabled);
    let queued = 0;

    for (const sched of due) {
      const presence = await ctx.db
        .query("agentPresence")
        .withIndex("by_agency", (q) => q.eq("agencyId", sched.agencyId))
        .collect();
      const lastSeen = presence.length
        ? Math.max(...presence.map((p) => p.lastSeenAt))
        : 0;
      if (now - lastSeen > ONLINE_MS) {
        // Agent offline — push next check out 1h, don't queue
        await ctx.db.patch(sched._id, { nextRunAt: now + 3600_000 });
        continue;
      }

      await ctx.db.insert("crawlRuns", {
        siteId: sched.siteId,
        status: "queued",
        mode: sched.mode,
        ignoreRobots: sched.ignoreRobots,
        startedAt: now,
      });
      await ctx.db.insert("activityEvents", {
        agencyId: sched.agencyId,
        kind: "crawl.scheduled",
        message: `Scheduled crawl queued for site ${sched.siteId}`,
        entityType: "sites",
        entityId: sched.siteId,
        createdAt: now,
      });
      await ctx.db.patch(sched._id, {
        lastQueuedAt: now,
        nextRunAt: now + sched.intervalHours * 3600_000,
      });
      queued += 1;
    }
    return { due: due.length, queued };
  },
});

/** Record agent heartbeat presence (internal from HTTP). */
export const touchPresence = internalMutation({
  args: {
    agencyId: v.id("agencies"),
    deviceLabel: v.optional(v.string()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("agentPresence")
      .withIndex("by_agency", (q) => q.eq("agencyId", args.agencyId))
      .collect();
    const match = rows.find(
      (r) => (r.deviceLabel ?? "") === (args.deviceLabel ?? ""),
    );
    const now = Date.now();
    if (match) {
      await ctx.db.patch(match._id, {
        lastSeenAt: now,
        source: args.source,
      });
      return { id: match._id };
    }
    const id = await ctx.db.insert("agentPresence", {
      agencyId: args.agencyId,
      deviceLabel: args.deviceLabel,
      lastSeenAt: now,
      source: args.source,
    });
    return { id };
  },
});
