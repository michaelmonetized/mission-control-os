/** In-memory store until Convex is configured — mirrors domain model for local dev */
import type { ClientId } from "@mc/protocol";

export type ClientRecord = {
  id: ClientId;
  name: string;
  isSelf?: boolean;
  domain?: string;
  createdAt: number;
};

const g = globalThis as unknown as { __mcStore?: { clients: ClientRecord[] } };

function store() {
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
    };
  }
  return g.__mcStore;
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
    id: `client_${Math.random().toString(36).slice(2, 10)}`,
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
