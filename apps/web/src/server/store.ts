/**
 * In-memory fallback for Vite `/api/*` middleware only.
 * Primary data path is Convex. Dual-write stubs keep ADR-0034 public CRM catalog offline-smokeable.
 */
import type { ClientId } from "@mc/protocol";

export type ClientRecord = {
  id: ClientId;
  name: string;
  isSelf?: boolean;
  domain?: string;
  createdAt: number;
};

export type ContactRecord = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  workspace?: string;
  createdAt: number;
};

export type CompanyRecord = {
  id: string;
  name: string;
  domain?: string;
  workspace?: string;
  createdAt: number;
};

export type OpportunityRecord = {
  id: string;
  name: string;
  stage: string;
  value?: number;
  workspace?: string;
  createdAt: number;
};

export type ConversationRecord = {
  id: string;
  channel: string;
  subject?: string;
  contactId?: string;
  workspace?: string;
  createdAt: number;
  messages: { id: string; direction: string; body: string; sentAt: number }[];
};

type StoreShape = {
  clients: ClientRecord[];
  contacts: ContactRecord[];
  companies: CompanyRecord[];
  opportunities: OpportunityRecord[];
  conversations: ConversationRecord[];
};

const g = globalThis as unknown as { __mcStore?: StoreShape };

function store(): StoreShape {
  if (!g.__mcStore) {
    g.__mcStore = {
      clients: [
        {
          id: "client_self",
          name: "Self Client",
          isSelf: true,
          createdAt: Date.now(),
        },
      ],
      contacts: [],
      companies: [],
      opportunities: [],
      conversations: [],
    };
  }
  // migrate older process stores missing CRM keys
  const s = g.__mcStore;
  s.contacts ??= [];
  s.companies ??= [];
  s.opportunities ??= [];
  s.conversations ??= [];
  return s;
}

function rid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function listClients(query?: string) {
  let items = store().clients;
  if (query) {
    const q = query.toLowerCase();
    items = items.filter((c) => c.name.toLowerCase().includes(q));
  }
  return items;
}

export function addClient(name: string) {
  const row: ClientRecord = {
    id: rid("client"),
    name,
    createdAt: Date.now(),
  };
  store().clients.push(row);
  return row;
}

export function updateClient(clientId: string, patch: Partial<ClientRecord>) {
  const c = store().clients.find((x) => x.id === clientId);
  if (!c) return null;
  Object.assign(c, patch);
  return c;
}

export function listContacts() {
  return store().contacts;
}

export function addContact(input: { name: string; email?: string; phone?: string; workspace?: string }) {
  const row: ContactRecord = {
    id: rid("contact"),
    name: input.name,
    email: input.email,
    phone: input.phone,
    workspace: input.workspace,
    createdAt: Date.now(),
  };
  store().contacts.push(row);
  return row;
}

export function updateContact(id: string, patch: Partial<ContactRecord>) {
  const c = store().contacts.find((x) => x.id === id);
  if (!c) return null;
  Object.assign(c, patch);
  return c;
}

export function listCompanies() {
  return store().companies;
}

export function addCompany(input: { name: string; domain?: string; workspace?: string }) {
  const row: CompanyRecord = {
    id: rid("company"),
    name: input.name,
    domain: input.domain,
    workspace: input.workspace,
    createdAt: Date.now(),
  };
  store().companies.push(row);
  return row;
}

export function listOpportunities() {
  return store().opportunities;
}

export function addOpportunity(input: {
  name: string;
  stage?: string;
  value?: number;
  workspace?: string;
}) {
  const row: OpportunityRecord = {
    id: rid("opp"),
    name: input.name,
    stage: input.stage ?? "qualified",
    value: input.value,
    workspace: input.workspace,
    createdAt: Date.now(),
  };
  store().opportunities.push(row);
  return row;
}

export function updateOpportunity(id: string, patch: Partial<OpportunityRecord>) {
  const o = store().opportunities.find((x) => x.id === id);
  if (!o) return null;
  Object.assign(o, patch);
  return o;
}

export function listConversations() {
  return store().conversations.map(({ messages: _m, ...rest }) => rest);
}

export function ingestConversation(input: {
  conversationId?: string;
  channel: string;
  subject?: string;
  contactId?: string;
  direction: string;
  body: string;
  workspace?: string;
}) {
  const s = store();
  let conv = input.conversationId
    ? s.conversations.find((c) => c.id === input.conversationId)
    : undefined;
  if (!conv) {
    conv = {
      id: rid("conv"),
      channel: input.channel,
      subject: input.subject,
      contactId: input.contactId,
      workspace: input.workspace,
      createdAt: Date.now(),
      messages: [],
    };
    s.conversations.push(conv);
  }
  const msg = {
    id: rid("msg"),
    direction: input.direction,
    body: input.body,
    sentAt: Date.now(),
  };
  conv.messages.push(msg);
  return { conversation: { id: conv.id, channel: conv.channel, subject: conv.subject }, message: msg };
}
