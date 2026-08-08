import {
  addClient,
  addCompany,
  addContact,
  addOpportunity,
  ingestConversation,
  listClients,
  listCompanies,
  listContacts,
  listConversations,
  listOpportunities,
  updateClient,
  updateContact,
  updateOpportunity,
} from "./store";

type Json = Record<string, unknown>;

async function readJson(req: Request): Promise<Json> {
  try {
    return (await req.json()) as Json;
  } catch {
    return {};
  }
}

function ok<T>(data: T, status = 200) {
  return Response.json({ ok: true, data }, { status });
}

function err(code: string, message: string, status = 400) {
  return Response.json({ ok: false, error: { code, message } }, { status });
}

/** ADR-0042 Vercel-style API handlers + ADR-0034 public CRM dual-write stubs */
export async function handleApi(req: Request, pathname: string): Promise<Response | null> {
  if (!pathname.startsWith("/api/")) return null;

  const path = pathname.replace(/\/$/, "") || pathname;

  // Gate memory stubs on Vercel *production* only (not every NODE_ENV=production
  // build — preview deployments need dual-write for agent/CRM smoke).
  const isVercelProduction = process.env.VERCEL_ENV === "production";
  if (isVercelProduction && process.env.MC_ALLOW_MEMORY_API !== "1") {
    return err(
      "use_convex",
      "In-memory /api dual-write disabled in production — use Convex SoT",
      501,
    );
  }

  if (path === "/api/clients/list" && req.method === "POST") {
    const body = await readJson(req);
    const filters = (body.filters ?? {}) as { query?: string };
    return ok({ items: listClients(filters.query) });
  }

  if (path === "/api/clients/add" && req.method === "POST") {
    const body = await readJson(req);
    const name = String(body.name ?? "").trim();
    if (!name) return err("invalid", "name required");
    return ok(addClient(name), 201);
  }

  if (path === "/api/clients/update" && req.method === "POST") {
    const body = await readJson(req);
    const clientId = String(body.clientId ?? "");
    const patch = (body.patch ?? {}) as { name?: string; domain?: string };
    const row = updateClient(clientId, patch);
    if (!row) return err("not_found", "client not found", 404);
    return ok(row);
  }

  if (path === "/api/crawl/run" && req.method === "POST") {
    const body = await readJson(req);
    return ok({
      crawlRunId: `run_${Date.now()}`,
      siteId: body.siteId,
      mode: body.mode ?? "rendered",
      ignoreRobots: Boolean(body.ignoreRobots),
      status: "queued",
      note: "Agent daemon picks up job when online (ADR-0004/0012)",
    });
  }

  if (path === "/api/crawl/results" && req.method === "POST") {
    return ok({
      items: [],
      metrics: {
        brokenLinks: 0,
        missingAlt: 0,
        pagesRetrieved: 0,
      },
    });
  }

  if (path === "/api/tasks/list" && req.method === "POST") {
    return ok({ items: [] });
  }

  if (path === "/api/notify/email" && req.method === "POST") {
    return ok({ queued: true, channel: "email" });
  }

  if (path === "/api/notify/sms" && req.method === "POST") {
    return ok({ queued: true, channel: "sms" });
  }

  if (path === "/api/agent/token" && req.method === "POST") {
    // Dev middleware stub — production Desktop should call Convex `agent.issueToken`
    // after Clerk session. Still returns a unique token so pairing works offline.
    const body = await readJson(req);
    const refreshToken = `dev_agent_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    return ok({
      refreshToken,
      agencyId: "local_dev_agency",
      expiresIn: 60 * 60 * 24 * 90,
      tokenType: "agent_refresh",
      deviceLabel: body.deviceLabel ?? "desktop",
      note: "Vite API stub. Prefer Convex agent.issueToken when signed in (ADR-0016).",
    });
  }

  if (path === "/api/agent/heartbeat" && req.method === "POST") {
    return ok({ status: "ok", ts: Date.now() });
  }

  if (path === "/api/automations/list" && req.method === "POST") {
    return ok({
      items: [],
      note: "Live data via Convex api.automations.list — HTTP catalog for ADR-0034/0042",
    });
  }

  if (path === "/api/automations/run" && req.method === "POST") {
    const body = await readJson(req);
    return ok({
      queued: true,
      automationId: body.automationId,
      note: "Prefer Convex automations.runInline / handoffs for live runs",
    });
  }

  // Public CRM dual-write catalog (ADR-0034) — in-memory when offline; Convex is SoT
  if (path === "/api/crm/contacts/list" && req.method === "POST") {
    return ok({ items: listContacts(), source: "vite_memory" });
  }
  if (path === "/api/crm/contacts/add" && req.method === "POST") {
    const body = await readJson(req);
    const name = String(body.name ?? "").trim();
    if (!name) return err("invalid", "name required");
    return ok(
      addContact({
        name,
        email: body.email ? String(body.email) : undefined,
        phone: body.phone ? String(body.phone) : undefined,
        workspace: body.workspace ? String(body.workspace) : undefined,
      }),
      201,
    );
  }
  if (path === "/api/crm/contacts/update" && req.method === "POST") {
    const body = await readJson(req);
    const id = String(body.contactId ?? body.id ?? "");
    const patch = (body.patch ?? body) as { name?: string; email?: string; phone?: string };
    const row = updateContact(id, patch);
    if (!row) return err("not_found", "contact not found", 404);
    return ok(row);
  }

  if (path === "/api/crm/companies/list" && req.method === "POST") {
    return ok({ items: listCompanies(), source: "vite_memory" });
  }
  if (path === "/api/crm/companies/add" && req.method === "POST") {
    const body = await readJson(req);
    const name = String(body.name ?? "").trim();
    if (!name) return err("invalid", "name required");
    return ok(
      addCompany({
        name,
        domain: body.domain ? String(body.domain) : undefined,
        workspace: body.workspace ? String(body.workspace) : undefined,
      }),
      201,
    );
  }

  if (path === "/api/crm/opportunities/list" && req.method === "POST") {
    return ok({ items: listOpportunities(), source: "vite_memory" });
  }
  if (path === "/api/crm/opportunities/add" && req.method === "POST") {
    const body = await readJson(req);
    const name = String(body.name ?? "").trim();
    if (!name) return err("invalid", "name required");
    return ok(
      addOpportunity({
        name,
        stage: body.stage ? String(body.stage) : undefined,
        value: typeof body.value === "number" ? body.value : undefined,
        workspace: body.workspace ? String(body.workspace) : undefined,
      }),
      201,
    );
  }
  if (path === "/api/crm/opportunities/update" && req.method === "POST") {
    const body = await readJson(req);
    const id = String(body.opportunityId ?? body.id ?? "");
    const patch = (body.patch ?? body) as { name?: string; stage?: string; value?: number };
    const row = updateOpportunity(id, patch);
    if (!row) return err("not_found", "opportunity not found", 404);
    return ok(row);
  }

  if (path === "/api/crm/conversations/list" && req.method === "POST") {
    return ok({ items: listConversations(), source: "vite_memory" });
  }
  if (path === "/api/crm/conversations/ingest" && req.method === "POST") {
    const body = await readJson(req);
    const channel = String(body.channel ?? "email");
    const direction = String(body.direction ?? "inbound");
    const msgBody = String(body.body ?? "").trim();
    if (!msgBody) return err("invalid", "body required");
    return ok(
      ingestConversation({
        conversationId: body.conversationId ? String(body.conversationId) : undefined,
        channel,
        subject: body.subject ? String(body.subject) : undefined,
        contactId: body.contactId ? String(body.contactId) : undefined,
        direction,
        body: msgBody,
        workspace: body.workspace ? String(body.workspace) : undefined,
      }),
      201,
    );
  }

  if (path === "/api/connections/list" && req.method === "POST") {
    return ok({ items: [], note: "Use Convex connections.list" });
  }

  if (path === "/api/social/posts/list" && req.method === "POST") {
    return ok({ items: [] });
  }

  if (path === "/api/pipeline/board" && req.method === "POST") {
    const stages = ["qualified", "proposal", "negotiation", "won", "lost"] as const;
    const items = listOpportunities();
    const columns: Record<string, typeof items> = {};
    for (const s of stages) columns[s] = items.filter((o) => o.stage === s);
    return ok({ stages: [...stages], columns, source: "vite_memory" });
  }

  if (path === "/api/search" && req.method === "POST") {
    const body = await readJson(req);
    const q = String(body.q ?? "").toLowerCase().trim();
    if (!q) return ok({ clients: [], contacts: [], opportunities: [] });
    return ok({
      clients: listClients(q).slice(0, 8),
      contacts: listContacts()
        .filter(
          (c) =>
            c.name.toLowerCase().includes(q) || (c.email ?? "").toLowerCase().includes(q),
        )
        .slice(0, 8),
      opportunities: listOpportunities()
        .filter((o) => o.name.toLowerCase().includes(q))
        .slice(0, 8),
      source: "vite_memory",
    });
  }

  if (path === "/api/schedules/list" && req.method === "POST") {
    return ok({ items: [], note: "Use Convex schedules.list" });
  }

  if (path === "/api/schedules/upsert" && req.method === "POST") {
    const body = await readJson(req);
    return ok({
      id: `sched_${Date.now()}`,
      siteId: body.siteId,
      intervalHours: Number(body.intervalHours ?? 24),
      nextRunAt: Date.now() + Number(body.intervalHours ?? 24) * 3600_000,
      note: "Vite stub — Convex schedules.upsert is SoT",
    }, 201);
  }

  if (path === "/api/billing/mine" && req.method === "POST") {
    return ok({
      plan: null,
      status: "none",
      catalog: {
        starter: { label: "Starter", priceMonthly: 99, seats: 3 },
        pro: { label: "Agency Pro", priceMonthly: 299, seats: 15 },
        enterprise: { label: "Enterprise", priceMonthly: 699, seats: 100 },
      },
      note: "Use Convex billing.getMine",
    });
  }

  if (path.startsWith("/api/")) {
    return err("not_found", `No handler for ${path}`, 404);
  }

  return null;
}
