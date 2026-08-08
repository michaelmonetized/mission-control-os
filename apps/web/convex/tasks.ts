import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAgencyByClerkOrg, requireAgencyOrg } from "./lib/auth";
import type { Id } from "./_generated/dataModel";

const taskFlag = v.union(v.literal("crm_nurture"), v.literal("delivery"));

async function assertClientInAgency(
  ctx: { db: { get: (id: Id<"clients">) => Promise<{ agencyId: Id<"agencies"> } | null> } },
  clientId: Id<"clients">,
  agencyId: Id<"agencies">,
) {
  const client = await ctx.db.get(clientId);
  if (!client || client.agencyId !== agencyId) return null;
  return client;
}

export const list = query({
  args: {
    /** Filter lens: CRM nurture vs Client PM delivery (ADR-0035) */
    lens: v.optional(v.union(v.literal("crm_nurture"), v.literal("delivery"), v.literal("all"))),
    clientId: v.optional(v.id("clients")),
    projectId: v.optional(v.id("projects")),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) return [];

    let rows;
    if (args.projectId) {
      const project = await ctx.db.get(args.projectId);
      if (!project) return [];
      const client = await assertClientInAgency(ctx, project.clientId, agency._id);
      if (!client) return [];
      rows = await ctx.db
        .query("tasks")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .collect();
    } else if (args.clientId) {
      const client = await assertClientInAgency(ctx, args.clientId, agency._id);
      if (!client) return [];
      rows = await ctx.db
        .query("tasks")
        .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
        .collect();
    } else {
      // Agency-wide: collect tasks for all clients under agency
      const clients = await ctx.db
        .query("clients")
        .withIndex("by_agency", (q) => q.eq("agencyId", agency._id))
        .collect();
      const clientIds = new Set(clients.map((c) => c._id));
      const all = await ctx.db.query("tasks").collect();
      rows = all.filter(
        (t) =>
          (t.clientId && clientIds.has(t.clientId)) ||
          // CRM nurture without client still agency-scoped via workspace
          t.workspaceId !== undefined,
      );
      // Filter workspace-only tasks to this agency's CRM workspaces
      const workspaces = await ctx.db
        .query("crmWorkspaces")
        .withIndex("by_agency", (q) => q.eq("agencyId", agency._id))
        .collect();
      const wsIds = new Set(workspaces.map((w) => w._id));
      rows = rows.filter(
        (t) =>
          (t.clientId && clientIds.has(t.clientId)) ||
          (t.workspaceId && wsIds.has(t.workspaceId)),
      );
    }

    const lens = args.lens ?? "all";
    if (lens === "crm_nurture") {
      rows = rows.filter((t) => t.flags.includes("crm_nurture"));
    } else if (lens === "delivery") {
      rows = rows.filter((t) => t.flags.includes("delivery"));
    }
    if (args.status) {
      rows = rows.filter((t) => t.status === args.status);
    }

    return rows.map((t) => ({
      id: t._id,
      title: t.title,
      status: t.status,
      flags: t.flags,
      tags: t.tags,
      clientId: t.clientId,
      projectId: t.projectId,
      contactId: t.contactId,
      workspaceId: t.workspaceId,
      assigneeUserId: t.assigneeUserId,
    }));
  },
});

export const add = mutation({
  args: {
    title: v.string(),
    flags: v.array(taskFlag),
    tags: v.optional(v.array(v.string())),
    clientId: v.optional(v.id("clients")),
    projectId: v.optional(v.id("projects")),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId, identity } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");

    const title = args.title.trim();
    if (!title) throw new Error("title required");

    let clientId = args.clientId;
    let workspaceId: Id<"crmWorkspaces"> | undefined;

    if (args.projectId) {
      const project = await ctx.db.get(args.projectId);
      if (!project) throw new Error("project not found");
      const client = await assertClientInAgency(ctx, project.clientId, agency._id);
      if (!client) throw new Error("project not in agency");
      clientId = project.clientId;
    } else if (clientId) {
      const client = await assertClientInAgency(ctx, clientId, agency._id);
      if (!client) throw new Error("client not found");
    }

    // CRM nurture without client → Agency CRM workspace
    if (args.flags.includes("crm_nurture") && !clientId) {
      const workspaces = await ctx.db
        .query("crmWorkspaces")
        .withIndex("by_agency", (q) => q.eq("agencyId", agency._id))
        .collect();
      const agencyWs = workspaces.find((w) => w.kind === "agency");
      workspaceId = agencyWs?._id;
    }

    // Delivery tasks need a client
    if (args.flags.includes("delivery") && !clientId) {
      throw new Error("delivery tasks require clientId or projectId");
    }

    const flags = args.flags.length ? args.flags : (["crm_nurture"] as ("crm_nurture" | "delivery")[]);

    const id = await ctx.db.insert("tasks", {
      title,
      status: args.status ?? "todo",
      flags,
      tags: args.tags ?? [],
      clientId,
      projectId: args.projectId,
      workspaceId,
      assigneeUserId: identity.subject,
    });

    const row = await ctx.db.get(id);
    return {
      id,
      title: row!.title,
      status: row!.status,
      flags: row!.flags,
      tags: row!.tags,
      clientId: row!.clientId,
      projectId: row!.projectId,
    };
  },
});

export const update = mutation({
  args: {
    taskId: v.id("tasks"),
    patch: v.object({
      title: v.optional(v.string()),
      status: v.optional(v.string()),
      flags: v.optional(v.array(taskFlag)),
      tags: v.optional(v.array(v.string())),
      projectId: v.optional(v.union(v.id("projects"), v.null())),
      clientId: v.optional(v.union(v.id("clients"), v.null())),
    }),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("task not found");

    if (task.clientId) {
      const client = await assertClientInAgency(ctx, task.clientId, agency._id);
      if (!client) throw new Error("task not in agency");
    } else if (task.workspaceId) {
      const ws = await ctx.db.get(task.workspaceId);
      if (!ws || ws.agencyId !== agency._id) throw new Error("task not in agency");
    } else {
      throw new Error("task not in agency");
    }

    const patch: Record<string, unknown> = {};
    if (args.patch.title !== undefined) patch.title = args.patch.title.trim();
    if (args.patch.status !== undefined) patch.status = args.patch.status;
    if (args.patch.flags !== undefined) patch.flags = args.patch.flags;
    if (args.patch.tags !== undefined) patch.tags = args.patch.tags;
    if (args.patch.projectId !== undefined) {
      patch.projectId = args.patch.projectId === null ? undefined : args.patch.projectId;
    }
    if (args.patch.clientId !== undefined) {
      patch.clientId = args.patch.clientId === null ? undefined : args.patch.clientId;
    }

    await ctx.db.patch(args.taskId, patch);
    const row = await ctx.db.get(args.taskId);
    return {
      id: row!._id,
      title: row!.title,
      status: row!.status,
      flags: row!.flags,
      tags: row!.tags,
      clientId: row!.clientId,
      projectId: row!.projectId,
    };
  },
});

/** Promote CRM nurture task into Client PM delivery under a Project (ADR-0035). */
export const promoteToProject = mutation({
  args: {
    taskId: v.id("tasks"),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("task not found");

    // Source task must already belong to this agency
    if (task.clientId) {
      const srcClient = await assertClientInAgency(ctx, task.clientId, agency._id);
      if (!srcClient) throw new Error("task not in agency");
    } else if (task.workspaceId) {
      const ws = await ctx.db.get(task.workspaceId);
      if (!ws || ws.agencyId !== agency._id) throw new Error("task not in agency");
    } else {
      throw new Error("task not in agency");
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("project not found");
    const client = await assertClientInAgency(ctx, project.clientId, agency._id);
    if (!client) throw new Error("project not in agency");

    const flags = Array.from(new Set([...task.flags.filter((f) => f !== "crm_nurture"), "delivery"]));

    await ctx.db.patch(args.taskId, {
      flags,
      projectId: args.projectId,
      clientId: project.clientId,
    });

    return { id: args.taskId, flags, projectId: args.projectId, clientId: project.clientId };
  },
});

export const listProjects = query({
  args: { clientId: v.optional(v.id("clients")) },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) return [];

    if (args.clientId) {
      const client = await assertClientInAgency(ctx, args.clientId, agency._id);
      if (!client) return [];
      const rows = await ctx.db
        .query("projects")
        .withIndex("by_client", (q) => q.eq("clientId", args.clientId!))
        .collect();
      return rows.map((p) => ({ id: p._id, name: p.name, clientId: p.clientId }));
    }

    const clients = await ctx.db
      .query("clients")
      .withIndex("by_agency", (q) => q.eq("agencyId", agency._id))
      .collect();
    const out: { id: Id<"projects">; name: string; clientId: Id<"clients"> }[] = [];
    for (const c of clients) {
      const rows = await ctx.db
        .query("projects")
        .withIndex("by_client", (q) => q.eq("clientId", c._id))
        .collect();
      for (const p of rows) {
        out.push({ id: p._id, name: p.name, clientId: p.clientId });
      }
    }
    return out;
  },
});

export const addProject = mutation({
  args: {
    clientId: v.id("clients"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");
    const client = await assertClientInAgency(ctx, args.clientId, agency._id);
    if (!client) throw new Error("client not found");
    const name = args.name.trim();
    if (!name) throw new Error("name required");
    const id = await ctx.db.insert("projects", { clientId: args.clientId, name });
    return { id, name, clientId: args.clientId };
  },
});
