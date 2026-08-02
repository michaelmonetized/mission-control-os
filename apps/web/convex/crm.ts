import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { getAgencyByClerkOrg, requireAgencyOrg } from "./lib/auth";
import type { Id } from "./_generated/dataModel";

type DbCtx = QueryCtx | MutationCtx;

const channel = v.union(
  v.literal("email"),
  v.literal("sms"),
  v.literal("social_dm"),
  v.literal("web_form"),
  v.literal("live_chat"),
);

async function agencyWorkspaces(ctx: DbCtx, agencyId: Id<"agencies">) {
  return ctx.db
    .query("crmWorkspaces")
    .withIndex("by_agency", (q) => q.eq("agencyId", agencyId))
    .collect();
}

async function resolveWorkspace(
  ctx: DbCtx,
  agencyId: Id<"agencies">,
  args: { workspaceId?: Id<"crmWorkspaces">; kind?: "agency" | "client"; clientId?: Id<"clients"> },
) {
  const workspaces = await agencyWorkspaces(ctx, agencyId);
  if (args.workspaceId) {
    const ws = workspaces.find((w) => w._id === args.workspaceId);
    if (!ws) throw new Error("workspace not found");
    return ws;
  }
  if (args.kind === "client" || args.clientId) {
    if (!args.clientId) throw new Error("clientId required for client CRM");
    const client = await ctx.db.get(args.clientId);
    if (!client || client.agencyId !== agencyId) throw new Error("client not found");
    const existing = workspaces.find((w) => w.kind === "client" && w.clientId === args.clientId);
    if (!existing) {
      if (!("insert" in ctx.db) || typeof (ctx as MutationCtx).db.insert !== "function") {
        throw new Error("Client CRM workspace missing");
      }
      const mctx = ctx as MutationCtx;
      const id = await mctx.db.insert("crmWorkspaces", {
        kind: "client",
        agencyId,
        clientId: args.clientId,
      });
      return { _id: id, kind: "client" as const, agencyId, clientId: args.clientId };
    }
    return existing;
  }
  const agencyWs = workspaces.find((w) => w.kind === "agency");
  if (!agencyWs) throw new Error("Agency CRM workspace missing — complete onboarding");
  return agencyWs;
}

export const listWorkspaces = query({
  args: {},
  handler: async (ctx) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) return [];
    const rows = await agencyWorkspaces(ctx, agency._id);
    return rows.map((w) => ({
      id: w._id,
      kind: w.kind,
      clientId: w.clientId,
    }));
  },
});

export const listContacts = query({
  args: {
    workspaceId: v.optional(v.id("crmWorkspaces")),
    kind: v.optional(v.union(v.literal("agency"), v.literal("client"))),
    clientId: v.optional(v.id("clients")),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) return [];
    const ws = await resolveWorkspace(ctx, agency._id, args);
    const rows = await ctx.db
      .query("contacts")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", ws._id))
      .collect();
    return rows.map((c) => ({
      id: c._id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      status: c.status,
      workspaceId: c.workspaceId,
    }));
  },
});

export const addContact = mutation({
  args: {
    workspaceId: v.optional(v.id("crmWorkspaces")),
    kind: v.optional(v.union(v.literal("agency"), v.literal("client"))),
    clientId: v.optional(v.id("clients")),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");
    const ws = await resolveWorkspace(ctx, agency._id, args);
    const name = args.name.trim();
    if (!name) throw new Error("name required");
    const id = await ctx.db.insert("contacts", {
      workspaceId: ws._id,
      name,
      email: args.email?.trim(),
      phone: args.phone?.trim(),
      status: "lead",
    });
    return { id, name, email: args.email, phone: args.phone, workspaceId: ws._id };
  },
});

export const listConversations = query({
  args: {
    workspaceId: v.optional(v.id("crmWorkspaces")),
    kind: v.optional(v.union(v.literal("agency"), v.literal("client"))),
    clientId: v.optional(v.id("clients")),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) return [];
    const ws = await resolveWorkspace(ctx, agency._id, args);
    const rows = await ctx.db
      .query("conversations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", ws._id))
      .collect();

    const enriched = await Promise.all(
      rows.map(async (c) => {
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", c._id))
          .collect();
        const last = messages.sort((a, b) => b.sentAt - a.sentAt)[0];
        return {
          id: c._id,
          channel: c.channel,
          subject: c.subject,
          contactId: c.contactId,
          workspaceId: c.workspaceId,
          messageCount: messages.length,
          lastBody: last?.body,
          lastAt: last?.sentAt,
        };
      }),
    );
    return enriched.sort((a, b) => (b.lastAt ?? 0) - (a.lastAt ?? 0));
  },
});

export const openConversation = mutation({
  args: {
    workspaceId: v.optional(v.id("crmWorkspaces")),
    kind: v.optional(v.union(v.literal("agency"), v.literal("client"))),
    clientId: v.optional(v.id("clients")),
    channel: channel,
    subject: v.optional(v.string()),
    contactId: v.optional(v.id("contacts")),
    initialBody: v.optional(v.string()),
    direction: v.optional(v.union(v.literal("inbound"), v.literal("outbound"))),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");
    const ws = await resolveWorkspace(ctx, agency._id, args);

    const conversationId = await ctx.db.insert("conversations", {
      workspaceId: ws._id,
      contactId: args.contactId,
      channel: args.channel,
      subject: args.subject,
    });

    if (args.initialBody?.trim()) {
      await ctx.db.insert("messages", {
        conversationId,
        channel: args.channel,
        direction: args.direction ?? "outbound",
        body: args.initialBody.trim(),
        sentAt: Date.now(),
      });
    }

    return { conversationId, workspaceId: ws._id };
  },
});

/** Multi-channel ingest entrypoint (web form, SMS webhook stubs, etc.). */
export const ingestMessage = mutation({
  args: {
    conversationId: v.optional(v.id("conversations")),
    workspaceId: v.optional(v.id("crmWorkspaces")),
    kind: v.optional(v.union(v.literal("agency"), v.literal("client"))),
    clientId: v.optional(v.id("clients")),
    channel: channel,
    direction: v.union(v.literal("inbound"), v.literal("outbound")),
    body: v.string(),
    contactId: v.optional(v.id("contacts")),
    subject: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) throw new Error("Agency not found");

    let conversationId = args.conversationId;
    if (!conversationId) {
      const ws = await resolveWorkspace(ctx, agency._id, args);
      conversationId = await ctx.db.insert("conversations", {
        workspaceId: ws._id,
        contactId: args.contactId,
        channel: args.channel,
        subject: args.subject,
      });
    } else {
      const conv = await ctx.db.get(conversationId);
      if (!conv) throw new Error("conversation not found");
      // tenancy: workspace must belong to agency
      const ws = await ctx.db.get(conv.workspaceId);
      if (!ws || ws.agencyId !== agency._id) throw new Error("conversation not in agency");
    }

    const messageId = await ctx.db.insert("messages", {
      conversationId,
      channel: args.channel,
      direction: args.direction,
      body: args.body.trim(),
      sentAt: Date.now(),
    });

    return { conversationId, messageId };
  },
});

export const listMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const { clerkOrgId } = await requireAgencyOrg(ctx);
    const agency = await getAgencyByClerkOrg(ctx, clerkOrgId);
    if (!agency) return [];
    const conv = await ctx.db.get(args.conversationId);
    if (!conv) return [];
    const ws = await ctx.db.get(conv.workspaceId);
    if (!ws || ws.agencyId !== agency._id) return [];
    const rows = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();
    return rows
      .sort((a, b) => a.sentAt - b.sentAt)
      .map((m) => ({
        id: m._id,
        channel: m.channel,
        direction: m.direction,
        body: m.body,
        sentAt: m.sentAt,
      }));
  },
});
