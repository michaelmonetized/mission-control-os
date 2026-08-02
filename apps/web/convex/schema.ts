import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/** Full domain schema — ADR tenancy + CRM + audit + social + tasks */
export default defineSchema({
  agencies: defineTable({
    clerkOrgId: v.string(),
    name: v.string(),
    onboardingStep: v.optional(v.number()),
  }).index("by_clerkOrg", ["clerkOrgId"]),

  clients: defineTable({
    agencyId: v.id("agencies"),
    name: v.string(),
    isSelf: v.boolean(),
    domain: v.optional(v.string()),
  })
    .index("by_agency", ["agencyId"])
    .index("by_agency_self", ["agencyId", "isSelf"]),

  locations: defineTable({
    clientId: v.id("clients"),
    name: v.string(),
    address: v.optional(v.string()),
  }).index("by_client", ["clientId"]),

  sites: defineTable({
    locationId: v.id("locations"),
    origin: v.string(),
  }).index("by_location", ["locationId"]),

  crmWorkspaces: defineTable({
    kind: v.union(v.literal("agency"), v.literal("client")),
    agencyId: v.id("agencies"),
    clientId: v.optional(v.id("clients")),
  }).index("by_agency", ["agencyId"]),

  contacts: defineTable({
    workspaceId: v.id("crmWorkspaces"),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    status: v.optional(v.string()),
  }).index("by_workspace", ["workspaceId"]),

  companies: defineTable({
    workspaceId: v.id("crmWorkspaces"),
    name: v.string(),
    domain: v.optional(v.string()),
  }).index("by_workspace", ["workspaceId"]),

  opportunities: defineTable({
    workspaceId: v.id("crmWorkspaces"),
    name: v.string(),
    stage: v.string(),
    value: v.optional(v.number()),
    pipelineId: v.optional(v.string()),
  }).index("by_workspace", ["workspaceId"]),

  conversations: defineTable({
    workspaceId: v.id("crmWorkspaces"),
    contactId: v.optional(v.id("contacts")),
    channel: v.string(),
    subject: v.optional(v.string()),
  }).index("by_workspace", ["workspaceId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    channel: v.string(),
    direction: v.union(v.literal("inbound"), v.literal("outbound")),
    body: v.string(),
    sentAt: v.number(),
  }).index("by_conversation", ["conversationId"]),

  projects: defineTable({
    clientId: v.id("clients"),
    name: v.string(),
  }).index("by_client", ["clientId"]),

  tasks: defineTable({
    title: v.string(),
    status: v.string(),
    flags: v.array(v.string()),
    tags: v.array(v.string()),
    clientId: v.optional(v.id("clients")),
    projectId: v.optional(v.id("projects")),
    contactId: v.optional(v.id("contacts")),
    workspaceId: v.optional(v.id("crmWorkspaces")),
    assigneeUserId: v.optional(v.string()),
  })
    .index("by_client", ["clientId"])
    .index("by_project", ["projectId"])
    .index("by_workspace", ["workspaceId"]),

  crawlRuns: defineTable({
    siteId: v.id("sites"),
    status: v.string(),
    mode: v.string(),
    ignoreRobots: v.boolean(),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_site", ["siteId"]),

  auditFindings: defineTable({
    crawlRunId: v.id("crawlRuns"),
    type: v.string(),
    severity: v.string(),
    url: v.string(),
    status: v.string(),
    shared: v.boolean(),
    message: v.optional(v.string()),
  }).index("by_run", ["crawlRunId"]),

  openIssues: defineTable({
    siteId: v.id("sites"),
    fingerprint: v.string(),
    type: v.string(),
    url: v.string(),
    status: v.string(),
    shared: v.boolean(),
  }).index("by_site", ["siteId"]),

  metricsSnapshots: defineTable({
    crawlRunId: v.id("crawlRuns"),
    siteId: v.id("sites"),
    completedAt: v.number(),
    brokenLinks: v.number(),
    missingAlt: v.number(),
    duplicatePercent: v.number(),
    pagesRetrieved: v.number(),
  }).index("by_site", ["siteId"]),

  socialPosts: defineTable({
    clientId: v.id("clients"),
    body: v.string(),
    mediaUrls: v.array(v.string()),
    link: v.optional(v.string()),
    channel: v.string(),
    scheduledAt: v.number(),
    status: v.string(),
    editNotes: v.optional(v.string()),
  }).index("by_client", ["clientId"]),

  emailDomains: defineTable({
    agencyId: v.id("agencies"),
    clientId: v.optional(v.id("clients")),
    domain: v.string(),
    verified: v.boolean(),
    resendDomainId: v.optional(v.string()),
    /** SPF/DKIM/DMARC records from Resend create/get (ADR-0036) */
    dnsRecords: v.optional(v.any()),
    status: v.optional(v.string()),
  }).index("by_agency", ["agencyId"]),

  automations: defineTable({
    workspaceId: v.id("crmWorkspaces"),
    name: v.string(),
    trigger: v.string(),
    definition: v.any(),
    enabled: v.boolean(),
  }).index("by_workspace", ["workspaceId"]),

  templates: defineTable({
    workspaceId: v.id("crmWorkspaces"),
    channel: v.union(v.literal("email"), v.literal("sms")),
    name: v.string(),
    body: v.string(),
    subject: v.optional(v.string()),
  }).index("by_workspace", ["workspaceId"]),

  portalGrants: defineTable({
    clientId: v.id("clients"),
    clerkUserId: v.optional(v.string()),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("member")),
  }).index("by_client", ["clientId"]),

  portalAllowlist: defineTable({
    clientId: v.id("clients"),
    email: v.string(),
  }).index("by_client", ["clientId"]),

  connectedAccounts: defineTable({
    agencyId: v.id("agencies"),
    clientId: v.optional(v.id("clients")),
    provider: v.string(),
    ownerKind: v.union(v.literal("agency"), v.literal("client")),
    externalId: v.string(),
  }).index("by_agency", ["agencyId"]),

  agentTokens: defineTable({
    clerkUserId: v.string(),
    agencyId: v.id("agencies"),
    refreshHash: v.string(),
    deviceLabel: v.optional(v.string()),
  }).index("by_user", ["clerkUserId"]),
});
