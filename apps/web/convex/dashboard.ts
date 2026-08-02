import { query } from "./_generated/server";
import { getAgencyByClerkOrg, requireAgencyOrg } from "./lib/auth";

/** Cockpit home stats (ADR-0031 ops overview). */
export const summary = query({
  args: {},
  handler: async (ctx) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) {
      return {
        clients: 0,
        openTasks: 0,
        queuedCrawls: 0,
        approvedPosts: 0,
        openFindings: 0,
      };
    }

    const clients = await ctx.db
      .query("clients")
      .withIndex("by_agency", (q) => q.eq("agencyId", agency._id))
      .collect();

    const clientIds = new Set(clients.map((c) => c._id));
    const allTasks = await ctx.db.query("tasks").collect();
    const openTasks = allTasks.filter(
      (t) =>
        t.status !== "done" &&
        ((t.clientId && clientIds.has(t.clientId)) || t.workspaceId),
    ).length;

    let queuedCrawls = 0;
    let openFindings = 0;
    let approvedPosts = 0;

    for (const client of clients) {
      const posts = await ctx.db
        .query("socialPosts")
        .withIndex("by_client", (q) => q.eq("clientId", client._id))
        .collect();
      approvedPosts += posts.filter((p) => p.status === "approved").length;

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
          queuedCrawls += runs.filter((r) => r.status === "queued").length;
          for (const run of runs) {
            const findings = await ctx.db
              .query("auditFindings")
              .withIndex("by_run", (q) => q.eq("crawlRunId", run._id))
              .collect();
            openFindings += findings.filter((f) => f.status === "open").length;
          }
        }
      }
    }

    return {
      clients: clients.length,
      openTasks,
      queuedCrawls,
      approvedPosts,
      openFindings,
    };
  },
});
