import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Agent-facing HTTP surface (ADR-0004/0012).
 * Auth: Authorization: Bearer <MC_AGENT_SECRET> (Convex env).
 */
const http = httpRouter();

function unauthorized() {
  return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

function checkAgentSecret(req: Request) {
  const secret = process.env.MC_AGENT_SECRET;
  if (!secret) return true; // open in dev if unset (still rate-limit at edge later)
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return token === secret;
}

http.route({
  path: "/agent/heartbeat",
  method: "POST",
  handler: httpAction(async (_ctx, req) => {
    if (!checkAgentSecret(req)) return unauthorized();
    return Response.json({ ok: true, ts: Date.now() });
  }),
});

http.route({
  path: "/agent/jobs",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    if (!checkAgentSecret(req)) return unauthorized();
    const jobs = await ctx.runQuery(internal.jobs.listQueuedInternal, {
      limit: 10,
    });
    return Response.json({ ok: true, data: { items: jobs } });
  }),
});

http.route({
  path: "/agent/jobs/claim",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    if (!checkAgentSecret(req)) return unauthorized();
    const body = (await req.json().catch(() => ({}))) as { crawlRunId?: string };
    if (!body.crawlRunId) {
      return Response.json({ ok: false, error: "crawlRunId required" }, { status: 400 });
    }
    try {
      const job = await ctx.runMutation(internal.jobs.claimInternal, {
        crawlRunId: body.crawlRunId as any,
      });
      return Response.json({ ok: true, data: job });
    } catch (e) {
      return Response.json(
        { ok: false, error: e instanceof Error ? e.message : String(e) },
        { status: 400 },
      );
    }
  }),
});

http.route({
  path: "/agent/findings",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    if (!checkAgentSecret(req)) return unauthorized();
    const body = (await req.json().catch(() => ({}))) as {
      crawlRunId?: string;
      type?: string;
      severity?: string;
      url?: string;
      message?: string;
    };
    if (!body.crawlRunId || !body.type || !body.url) {
      return Response.json({ ok: false, error: "crawlRunId, type, url required" }, { status: 400 });
    }
    try {
      const res = await ctx.runMutation(internal.jobs.streamFindingInternal, {
        crawlRunId: body.crawlRunId as any,
        type: body.type,
        severity: body.severity ?? "medium",
        url: body.url,
        message: body.message,
      });
      return Response.json({ ok: true, data: res });
    } catch (e) {
      return Response.json(
        { ok: false, error: e instanceof Error ? e.message : String(e) },
        { status: 400 },
      );
    }
  }),
});

http.route({
  path: "/agent/complete",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    if (!checkAgentSecret(req)) return unauthorized();
    const body = (await req.json().catch(() => ({}))) as {
      crawlRunId?: string;
      metrics?: {
        brokenLinks: number;
        missingAlt: number;
        duplicatePercent: number;
        pagesRetrieved: number;
      };
    };
    if (!body.crawlRunId || !body.metrics) {
      return Response.json({ ok: false, error: "crawlRunId + metrics required" }, { status: 400 });
    }
    try {
      const res = await ctx.runMutation(internal.jobs.completeInternal, {
        crawlRunId: body.crawlRunId as any,
        metrics: body.metrics,
      });
      return Response.json({ ok: true, data: res });
    } catch (e) {
      return Response.json(
        { ok: false, error: e instanceof Error ? e.message : String(e) },
        { status: 400 },
      );
    }
  }),
});

export default http;
