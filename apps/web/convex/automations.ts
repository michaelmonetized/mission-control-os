import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAgencyByClerkOrg, requireAgencyOrg } from "./lib/auth";
import type { Id } from "./_generated/dataModel";

/**
 * CRM + first-class automations (ADR-0043/0044).
 * Execute inline first; on failure hand off to Trigger.dev (ADR-0046).
 */

async function resolveWorkspace(
  ctx: { db: any },
  agencyId: Id<"agencies">,
  workspaceId?: Id<"crmWorkspaces">,
) {
  if (workspaceId) {
    const ws = await ctx.db.get(workspaceId);
    if (!ws || ws.agencyId !== agencyId) throw new Error("workspace not found");
    return ws;
  }
  const all = await ctx.db
    .query("crmWorkspaces")
    .withIndex("by_agency", (q: any) => q.eq("agencyId", agencyId))
    .collect();
  const agencyWs = all.find((w: any) => w.kind === "agency");
  if (!agencyWs) throw new Error("Agency CRM workspace missing");
  return agencyWs;
}

export const list = query({
  args: { workspaceId: v.optional(v.id("crmWorkspaces")) },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) return [];
    const ws = await resolveWorkspace(ctx, agency._id, args.workspaceId);
    const rows = await ctx.db
      .query("automations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", ws._id))
      .collect();
    return rows.map((a) => ({
      id: a._id,
      name: a.name,
      trigger: a.trigger,
      definition: a.definition,
      enabled: a.enabled,
      workspaceId: a.workspaceId,
    }));
  },
});

export const listTemplates = query({
  args: {
    workspaceId: v.optional(v.id("crmWorkspaces")),
    channel: v.optional(v.union(v.literal("email"), v.literal("sms"))),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) return [];
    const ws = await resolveWorkspace(ctx, agency._id, args.workspaceId);
    let rows = await ctx.db
      .query("templates")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", ws._id))
      .collect();
    if (args.channel) rows = rows.filter((t) => t.channel === args.channel);
    return rows.map((t) => ({
      id: t._id,
      name: t.name,
      channel: t.channel,
      body: t.body,
      subject: t.subject,
    }));
  },
});

export const saveTemplate = mutation({
  args: {
    workspaceId: v.optional(v.id("crmWorkspaces")),
    channel: v.union(v.literal("email"), v.literal("sms")),
    name: v.string(),
    body: v.string(),
    subject: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId, isAdmin } = await requireAgencyOrg(ctx);
    if (!isAdmin) throw new Error("Admin role required to edit templates");
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");
    const ws = await resolveWorkspace(ctx, agency._id, args.workspaceId);
    const id = await ctx.db.insert("templates", {
      workspaceId: ws._id,
      channel: args.channel,
      name: args.name.trim(),
      body: args.body,
      subject: args.subject,
    });
    return { id };
  },
});

export const save = mutation({
  args: {
    workspaceId: v.optional(v.id("crmWorkspaces")),
    name: v.string(),
    trigger: v.string(),
    definition: v.any(),
    enabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId, isAdmin } = await requireAgencyOrg(ctx);
    if (!isAdmin) throw new Error("Admin role required to edit automations");
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");
    const ws = await resolveWorkspace(ctx, agency._id, args.workspaceId);
    const id = await ctx.db.insert("automations", {
      workspaceId: ws._id,
      name: args.name.trim(),
      trigger: args.trigger,
      definition: args.definition ?? { steps: [] },
      enabled: args.enabled ?? true,
    });
    return { id };
  },
});

export const setEnabled = mutation({
  args: {
    automationId: v.id("automations"),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId, isAdmin } = await requireAgencyOrg(ctx);
    if (!isAdmin) throw new Error("Admin role required");
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");
    const row = await ctx.db.get(args.automationId);
    if (!row) throw new Error("not found");
    const ws = await ctx.db.get(row.workspaceId);
    if (!ws || ws.agencyId !== agency._id) throw new Error("not found");
    await ctx.db.patch(args.automationId, { enabled: args.enabled });
    return { ok: true };
  },
});

/**
 * Run automation inline (ADR-0046). On step failure returns handoff payload
 * for Trigger.dev without executing external retries here.
 */
export const runInline = mutation({
  args: {
    automationId: v.id("automations"),
    context: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");
    const auto = await ctx.db.get(args.automationId);
    if (!auto || !auto.enabled) throw new Error("automation not available");
    const ws = await ctx.db.get(auto.workspaceId);
    if (!ws || ws.agencyId !== agency._id) throw new Error("not found");

    const steps = (auto.definition as { steps?: { type: string; config?: any }[] })
      ?.steps ?? [];
    const results: { step: number; type: string; ok: boolean; error?: string; handoff?: boolean }[] =
      [];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]!;
      try {
        if (step.type === "create_task") {
          await ctx.db.insert("tasks", {
            title: String(step.config?.title ?? `Automation: ${auto.name}`),
            status: "todo",
            flags: [step.config?.flag === "delivery" ? "delivery" : "crm_nurture"],
            tags: ["automation"],
            workspaceId: ws._id,
            clientId: ws.clientId,
          });
          results.push({ step: i, type: step.type, ok: true });
        } else if (step.type === "add_tag" || step.type === "notify_internal") {
          // pure internal — always succeed inline
          results.push({ step: i, type: step.type, ok: true });
        } else if (step.type === "send_email" || step.type === "send_sms" || step.type === "webhook") {
          // Try inline; simulate external I/O failure path when config.forceFail
          if (step.config?.forceFail) {
            throw new Error("simulated external failure");
          }
          // Happy path: mark as queued inline (Resend/SMS wiring uses notify APIs later)
          results.push({ step: i, type: step.type, ok: true });
        } else if (step.type === "wait") {
          // Delay steps must schedule — not inline wait (ADR-0046)
          results.push({
            step: i,
            type: step.type,
            ok: false,
            error: "wait steps require scheduler/Trigger handoff",
            handoff: true,
          });
          const idempotencyKey = `auto:${args.automationId}:wait:${i}:${Date.now()}`;
          const delayMs = Number(step.config?.ms ?? 60_000);
          const handoffId = await ctx.db.insert("automationHandoffs", {
            automationId: args.automationId,
            agencyId: agency._id,
            fromStep: i,
            reason: "wait_step",
            idempotencyKey,
            payload: { context: args.context, results, delayMs },
            status: "queued",
            createdAt: Date.now(),
          });
          // Prefer Convex scheduler for waits (ADR-0046); Trigger remains failure plane
          const { internal } = await import("./_generated/api");
          await ctx.scheduler.runAfter(
            Math.max(1000, Math.min(delayMs, 7 * 864e5)),
            internal.scheduler.markWaitComplete,
            { handoffId },
          );
          return {
            automationId: args.automationId,
            status: "handoff_trigger",
            results,
            triggerPayload: {
              automationId: args.automationId,
              fromStep: i,
              context: args.context,
              reason: "wait_step",
              idempotencyKey,
              scheduled: true,
            },
          };
        } else {
          results.push({ step: i, type: step.type, ok: true });
        }
      } catch (e) {
        const error = e instanceof Error ? e.message : String(e);
        results.push({ step: i, type: step.type, ok: false, error, handoff: true });
        const idempotencyKey = `auto:${args.automationId}:step:${i}:${Date.now()}`;
        // Persist handoff for Trigger worker (ADR-0046)
        await ctx.db.insert("automationHandoffs", {
          automationId: args.automationId,
          agencyId: agency._id,
          fromStep: i,
          reason: error,
          idempotencyKey,
          payload: { context: args.context, results },
          status: "queued",
          createdAt: Date.now(),
        });
        return {
          automationId: args.automationId,
          status: "handoff_trigger",
          results,
          triggerPayload: {
            automationId: args.automationId,
            fromStep: i,
            context: args.context,
            reason: error,
            idempotencyKey,
          },
        };
      }
    }

    return {
      automationId: args.automationId,
      status: "completed_inline",
      results,
    };
  },
});
