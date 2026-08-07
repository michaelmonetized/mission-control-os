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
  if (!secret) return true; // open in dev if unset
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  return token === secret;
}

http.route({
  path: "/agent/health",
  method: "GET",
  handler: httpAction(async () => {
    return Response.json({
      ok: true,
      service: "mission-control-agent-http",
      ts: Date.now(),
    });
  }),
});

http.route({
  path: "/agent/heartbeat",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    if (!checkAgentSecret(req)) return unauthorized();
    const body = (await req.json().catch(() => ({}))) as {
      agencyId?: string;
      deviceLabel?: string;
      source?: string;
    };
    if (body.agencyId) {
      try {
        await ctx.runMutation(internal.schedules.touchPresence, {
          agencyId: body.agencyId as any,
          deviceLabel: body.deviceLabel,
          source: body.source ?? "heartbeat",
        });
      } catch {
        /* ignore bad agencyId */
      }
    }
    return Response.json({ ok: true, ts: Date.now() });
  }),
});

/** Trigger.dev / local worker handoff plane (ADR-0046). */
http.route({
  path: "/trigger/handoffs",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    if (!checkAgentSecret(req)) return unauthorized();
    const items = await ctx.runQuery(internal.handoffs.listQueuedInternal, {
      limit: 20,
    });
    return Response.json({ ok: true, data: { items } });
  }),
});

http.route({
  path: "/trigger/handoffs/claim",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    if (!checkAgentSecret(req)) return unauthorized();
    const body = (await req.json().catch(() => ({}))) as { handoffId?: string };
    if (!body.handoffId) {
      return Response.json({ ok: false, error: "handoffId required" }, { status: 400 });
    }
    try {
      const job = await ctx.runMutation(internal.handoffs.claimInternal, {
        handoffId: body.handoffId as any,
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
  path: "/trigger/handoffs/complete",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    if (!checkAgentSecret(req)) return unauthorized();
    const body = (await req.json().catch(() => ({}))) as {
      handoffId?: string;
      status?: "done" | "failed";
      note?: string;
    };
    if (!body.handoffId) {
      return Response.json({ ok: false, error: "handoffId required" }, { status: 400 });
    }
    try {
      const res = await ctx.runMutation(internal.handoffs.completeInternal, {
        handoffId: body.handoffId as any,
        status: body.status === "failed" ? "failed" : "done",
        note: body.note,
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
      findings?: {
        type: string;
        severity?: string;
        url: string;
        message?: string;
      }[];
    };
    if (body.crawlRunId && Array.isArray(body.findings)) {
      const ids: unknown[] = [];
      for (const f of body.findings) {
        try {
          const res = await ctx.runMutation(internal.jobs.streamFindingInternal, {
            crawlRunId: body.crawlRunId as any,
            type: f.type,
            severity: f.severity ?? "medium",
            url: f.url,
            message: f.message,
          });
          ids.push(res.findingId);
        } catch {
          /* continue */
        }
      }
      return Response.json({ ok: true, data: { count: ids.length, ids } });
    }
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

/**
 * Stripe webhooks (ADR-0001 / 0031).
 * Configure endpoint: https://<deployment>.convex.site/stripe/webhook
 * Env: STRIPE_WEBHOOK_SECRET
 */
http.route({
  path: "/stripe/webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const whSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
    if (!whSecret) {
      return Response.json(
        { ok: false, error: "STRIPE_WEBHOOK_SECRET not configured" },
        { status: 503 },
      );
    }
    const rawBody = await req.text();
    const { verifyStripeSignature, normalizeStripeEvent } = await import(
      "./lib/stripeWebhook"
    );
    const verified = await verifyStripeSignature(
      rawBody,
      req.headers.get("stripe-signature"),
      whSecret,
    );
    if (!verified.ok) {
      return Response.json({ ok: false, error: verified.error }, { status: 400 });
    }

    let event: { type: string; data?: { object?: Record<string, unknown> } };
    try {
      event = JSON.parse(rawBody);
    } catch {
      return Response.json({ ok: false, error: "invalid json" }, { status: 400 });
    }

    const n = normalizeStripeEvent(event);
    // Only persist when we have enough to upsert; ack other events as ok no-op
    if (
      n.agencyId &&
      n.stripeCustomerId &&
      n.stripeSubscriptionId &&
      n.plan &&
      n.status &&
      n.currentPeriodEnd != null
    ) {
      const res = await ctx.runMutation(internal.billing.applyStripeEvent, {
        type: n.type,
        agencyId: n.agencyId,
        stripeCustomerId: n.stripeCustomerId,
        stripeSubscriptionId: n.stripeSubscriptionId,
        plan: n.plan,
        status: n.status,
        currentPeriodEnd: n.currentPeriodEnd,
      });
      return Response.json({ ok: true, applied: res });
    }

    return Response.json({
      ok: true,
      applied: false,
      type: n.type,
      note: "event acknowledged; incomplete billing fields (wait for subscription.*)",
    });
  }),
});

export default http;
