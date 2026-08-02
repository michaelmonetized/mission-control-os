/** Shared Mission Control contracts — ADR-0018 */

export type AgencyId = string;
export type ClientId = string;
export type LocationId = string;
export type SiteId = string;
export type UserId = string;
export type CrmWorkspaceId = string;

export type Role = "admin" | "member";

export type FindingStatus =
  | "open"
  | "triaged"
  | "in_progress"
  | "done"
  | "wont_fix"
  | "false_positive";

export type ConversationChannel =
  | "email"
  | "sms"
  | "social_dm"
  | "web_form"
  | "live_chat";

export type TaskFlag = "crm_nurture" | "delivery";

export type SocialPostStatus = "approved" | "disapproved" | "published" | "failed" | "scheduled";

export interface ApiEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export interface ListClientsBody {
  filters?: { query?: string; isSelf?: boolean };
  cursor?: string | null;
  limit?: number;
}

export interface UpdateClientBody {
  clientId: ClientId;
  patch: Partial<{ name: string; domain: string }>;
}

export interface CrawlRunBody {
  siteId: SiteId;
  ignoreRobots?: boolean;
  mode?: "rendered" | "http_only";
}

export interface MetricsSnapshot {
  crawlRunId: string;
  completedAt: number;
  brokenLinks: number;
  missingAlt: number;
  duplicatePercent: number;
  pagesRetrieved: number;
}

/** API path catalog (ADR-0042) — no version segment */
export const API = {
  clients: {
    list: "/api/clients/list",
    add: "/api/clients/add",
    update: "/api/clients/update",
  },
  locations: {
    list: "/api/locations/list",
    add: "/api/locations/add",
  },
  sites: {
    list: "/api/sites/list",
    add: "/api/sites/add",
  },
  crawl: {
    run: "/api/crawl/run",
    results: "/api/crawl/results",
    findings: "/api/crawl/findings",
  },
  tasks: {
    list: "/api/tasks/list",
    add: "/api/tasks/add",
    update: "/api/tasks/update",
    promote: "/api/tasks/promote",
    projectsList: "/api/tasks/projects/list",
    projectsAdd: "/api/tasks/projects/add",
  },
  crm: {
    contactsList: "/api/crm/contacts/list",
    contactsAdd: "/api/crm/contacts/add",
    contactsUpdate: "/api/crm/contacts/update",
    companiesList: "/api/crm/companies/list",
    companiesAdd: "/api/crm/companies/add",
    opportunitiesList: "/api/crm/opportunities/list",
    opportunitiesAdd: "/api/crm/opportunities/add",
    opportunitiesUpdate: "/api/crm/opportunities/update",
    conversationsList: "/api/crm/conversations/list",
    conversationsIngest: "/api/crm/conversations/ingest",
  },
  notify: {
    email: "/api/notify/email",
    sms: "/api/notify/sms",
  },
  social: {
    postsList: "/api/social/posts/list",
    postsAdd: "/api/social/posts/add",
  },
  connections: {
    list: "/api/connections/list",
    add: "/api/connections/add",
    remove: "/api/connections/remove",
  },
  automations: {
    list: "/api/automations/list",
    run: "/api/automations/run",
    templatesList: "/api/automations/templates/list",
    templatesAdd: "/api/automations/templates/add",
  },
  agent: {
    token: "/api/agent/token",
    heartbeat: "/api/agent/heartbeat",
    crawlJobs: "/api/agent/crawl/jobs",
  },
  email: {
    domainsList: "/api/email/domains/list",
    domainsProvision: "/api/email/domains/provision",
    domainsVerify: "/api/email/domains/verify",
  },
} as const;

/** Finding status set (ADR-0023) */
export const FINDING_STATUSES = [
  "open",
  "triaged",
  "in_progress",
  "done",
  "wont_fix",
  "false_positive",
] as const;

export type FindingStatusApi = (typeof FINDING_STATUSES)[number];
