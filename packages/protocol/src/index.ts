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
  mode?: "rendered" | "http_only" | "cwv";
  /** Playwright Core Web Vitals pass (ADR-0008) */
  cwv?: boolean;
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
  pipeline: {
    board: "/api/pipeline/board",
  },
  search: {
    agency: "/api/search",
  },
  activity: {
    list: "/api/activity/list",
  },
  reports: {
    list: "/api/reports/list",
  },
  jobs: {
    crawlQueued: "/api/agent/crawl/jobs",
  },
  trigger: {
    handoffs: "/trigger/handoffs",
    claim: "/trigger/handoffs/claim",
    complete: "/trigger/handoffs/complete",
  },
  schedules: {
    list: "/api/schedules/list",
    upsert: "/api/schedules/upsert",
  },
  billing: {
    mine: "/api/billing/mine",
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

/** Finding types emitted by Local Agent (ADR-0003/0008) */
export const FINDING_TYPES = [
  "broken_link",
  "missing_alt",
  "missing_title",
  "title_too_long",
  "missing_h1",
  "multiple_h1",
  "missing_meta_description",
  "canonical_off_origin",
  "noindex",
  "duplicate_title",
  "thin_content",
  "missing_viewport",
  "mixed_content",
  "missing_html_lang",
  "missing_og_title",
  "missing_charset",
  "empty_h1",
  "title_too_short",
  "missing_favicon",
  "missing_structured_data",
  "missing_hreflang",
  /** CWV-adjacent HTML heuristics (ADR-0008) */
  "large_image_no_dimensions",
  "render_blocking_script",
  "missing_lazy_loading",
  /** Full Playwright CWV pass (ADR-0008) */
  "cwv_lcp_poor",
  "cwv_lcp_needs_improvement",
  "cwv_cls_poor",
  "cwv_cls_needs_improvement",
  "cwv_ttfb_slow",
  "cwv_fcp_poor",
  "cwv_fcp_needs_improvement",
  "cwv_snapshot",
  "cwv_measurement_failed",
] as const;

export type FindingTypeApi = (typeof FINDING_TYPES)[number];

export const SOCIAL_POST_STATUSES = [
  "approved",
  "disapproved",
  "published",
  "failed",
  "scheduled",
] as const;

export const OPPORTUNITY_STAGES = [
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
] as const;

export const AUTOMATION_TRIGGERS = [
  "ingest.contact",
  "status.changed",
  "pipeline.stage_changed",
  "deal.won",
  "deal.lost",
  "message.received",
  "tag.added",
] as const;
