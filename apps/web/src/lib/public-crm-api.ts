/**
 * Public CRM API surface (ADR-0034 / ADR-0042) — path catalog + envelope helpers.
 * Live data lives in Convex; HTTP handlers proxy or document the contract.
 */

export const PUBLIC_CRM_API = {
  contacts: {
    list: "/api/crm/contacts/list",
    add: "/api/crm/contacts/add",
    update: "/api/crm/contacts/update",
  },
  companies: {
    list: "/api/crm/companies/list",
    add: "/api/crm/companies/add",
  },
  opportunities: {
    list: "/api/crm/opportunities/list",
    add: "/api/crm/opportunities/add",
    update: "/api/crm/opportunities/update",
  },
  conversations: {
    list: "/api/crm/conversations/list",
    ingest: "/api/crm/conversations/ingest",
  },
  automations: {
    list: "/api/automations/list",
    run: "/api/automations/run",
  },
  pipeline: {
    board: "/api/pipeline/board",
  },
  search: {
    agency: "/api/search",
  },
} as const;

export type PublicCrmListBody = {
  workspace?: "agency" | "client";
  clientId?: string;
  cursor?: string | null;
  limit?: number;
};
