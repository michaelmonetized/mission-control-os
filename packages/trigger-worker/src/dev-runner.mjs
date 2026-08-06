/**
 * Local Trigger.dev-style worker (ADR-0046).
 * Polls Convex `/trigger/handoffs`, claims, resumes (delay), completes.
 *
 * Env:
 *   CONVEX_URL / VITE_CONVEX_URL — Convex site URL (https://….convex.site)
 *   MC_AGENT_SECRET — shared secret (same as agent HTTP)
 *   MC_TRIGGER_POLL_MS — poll interval (default 15000)
 *   TRIGGER_SECRET_KEY — when set, logs prod-deploy hint for @trigger.dev/sdk
 *
 * Production: replace with @trigger.dev/sdk task `mc-automation-resume`.
 */
import { z } from "zod";

const Payload = z.object({
  automationId: z.string(),
  fromStep: z.number(),
  reason: z.string(),
  idempotencyKey: z.string(),
  delayMs: z.number().optional(),
});

const intervalMs = Number(process.env.MC_TRIGGER_POLL_MS ?? 15_000);
const convexUrl = (process.env.CONVEX_URL ?? process.env.VITE_CONVEX_URL ?? "").replace(/\/$/, "");
const agentSecret = process.env.MC_AGENT_SECRET ?? "";

function authHeaders() {
  return {
    "Content-Type": "application/json",
    ...(agentSecret ? { Authorization: `Bearer ${agentSecret}` } : {}),
  };
}

/**
 * @param {unknown} payload
 */
async function resume(payload) {
  const p = Payload.parse(payload);
  if (p.delayMs && p.delayMs > 0) {
    const wait = Math.min(p.delayMs, 10_000);
    console.log(`[trigger-worker] wait ${wait}ms for ${p.idempotencyKey}`);
    await new Promise((r) => setTimeout(r, wait));
  }
  console.log(`[trigger-worker] resumed automation ${p.automationId} from step ${p.fromStep}`);
  return { ok: true, automationId: p.automationId, fromStep: p.fromStep };
}

/**
 * Claim + complete handoffs from Convex HTTP surface.
 */
async function pollHandoffs() {
  if (!convexUrl) {
    console.log("[trigger-worker] no CONVEX_URL — mock tick only");
    return;
  }
  try {
    const listRes = await fetch(`${convexUrl}/trigger/handoffs`, {
      headers: authHeaders(),
    });
    if (!listRes.ok) {
      // Fallback liveness when routes not deployed yet
      const health = await fetch(`${convexUrl}/agent/health`, {
        headers: authHeaders(),
      });
      console.log(
        `[trigger-worker] handoffs ${listRes.status}; health ${health.status}`,
      );
      return;
    }
    const body = await listRes.json().catch(() => ({}));
    const items = body?.data?.items ?? [];
    if (items.length === 0) {
      console.log("[trigger-worker] no queued handoffs");
      return;
    }

    for (const item of items.slice(0, 5)) {
      const claimRes = await fetch(`${convexUrl}/trigger/handoffs/claim`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ handoffId: item.id }),
      });
      if (!claimRes.ok) {
        console.log(`[trigger-worker] claim failed ${item.id}: ${claimRes.status}`);
        continue;
      }
      const claimed = await claimRes.json().catch(() => ({}));
      const data = claimed?.data ?? item;
      const delayMs =
        typeof data?.payload?.delayMs === "number"
          ? data.payload.delayMs
          : undefined;

      try {
        await resume({
          automationId: String(data.automationId),
          fromStep: Number(data.fromStep ?? 0),
          reason: String(data.reason ?? "resume"),
          idempotencyKey: String(data.idempotencyKey ?? item.id),
          delayMs,
        });
        const done = await fetch(`${convexUrl}/trigger/handoffs/complete`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            handoffId: item.id,
            status: "done",
            note: "trigger-worker resume",
          }),
        });
        console.log(
          `[trigger-worker] completed ${item.id} → ${done.status}`,
        );
      } catch (e) {
        await fetch(`${convexUrl}/trigger/handoffs/complete`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            handoffId: item.id,
            status: "failed",
            note: e instanceof Error ? e.message : String(e),
          }),
        });
        console.log(`[trigger-worker] failed ${item.id}: ${e}`);
      }
    }
  } catch (e) {
    console.log(`[trigger-worker] poll error: ${e instanceof Error ? e.message : String(e)}`);
  }
}

function start() {
  console.log(`[trigger-worker] started (poll ${intervalMs}ms)`);
  console.log(
    process.env.TRIGGER_SECRET_KEY
      ? "[trigger-worker] TRIGGER_SECRET_KEY present — use Trigger cloud deploy for prod"
      : "[trigger-worker] local claim loop — set TRIGGER_SECRET_KEY for cloud",
  );
  if (convexUrl) {
    console.log(`[trigger-worker] CONVEX_URL=${convexUrl}`);
  }

  setInterval(() => {
    console.log(`[trigger-worker] heartbeat ${new Date().toISOString()}`);
    void pollHandoffs();
  }, intervalMs);

  // Immediate first poll
  void pollHandoffs();
}

const isMain =
  typeof process !== "undefined" &&
  process.argv[1] &&
  (process.argv[1].endsWith("dev-runner.mjs") || process.argv[1].includes("trigger-worker"));

if (isMain) {
  start();
}

export { resume, Payload, pollHandoffs, start };
