import { addClient, listClients, updateClient } from "./store";

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

/** ADR-0042 Vercel-style API handlers */
export async function handleApi(req: Request, pathname: string): Promise<Response | null> {
  if (!pathname.startsWith("/api/")) return null;

  const path = pathname.replace(/\/$/, "") || pathname;

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
    return ok({
      refreshToken: "dev_refresh_placeholder",
      expiresIn: 3600,
      note: "Desktop writes to OS secret store (ADR-0016)",
    });
  }

  if (path === "/api/agent/heartbeat" && req.method === "POST") {
    return ok({ status: "ok", ts: Date.now() });
  }

  if (path === "/api/automations/list" && req.method === "POST") {
    return ok({ items: [] });
  }

  if (path === "/api/social/posts/list" && req.method === "POST") {
    return ok({ items: [] });
  }

  if (path.startsWith("/api/")) {
    return err("not_found", `No handler for ${path}`, 404);
  }

  return null;
}
