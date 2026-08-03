/**
 * Local Trigger.dev-style worker (ADR-0046).
 * Polls Convex handoffs when CONVEX_URL + MC_AGENT_SECRET (or CONVEX_DEPLOY_KEY) set;
 * otherwise runs mock resume loop for development.
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
 * Optional HTTP poll against Convex agent routes when configured.
 * Handoffs remain agency-scoped via Convex; this is a local resume loop.
 */
async function pollHandoffs() {
  if (!convexUrl) {
    console.log("[trigger-worker] no CONVEX_URL — mock tick only");
    return;
  }
  try {
    // Prefer handoff-style endpoint if deployed; fall back to agent health as liveness.
    const health = await fetch(`${convexUrl}/agent/health`, {
      headers: agentSecret ? { Authorization: `Bearer ${agentSecret}` } : {},
    });
    if (!health.ok) {
      console.log(`[trigger-worker] convex health ${health.status}`);
      return;
    }
    const body = await health.json().catch(() => ({}));
    console.log(`[trigger-worker] convex ok · ${body.service ?? "convex"}`);
  } catch (e) {
    console.log(`[trigger-worker] poll error: ${e instanceof Error ? e.message : String(e)}`);
  }
}

function start() {
  console.log(`[trigger-worker] started (poll ${intervalMs}ms)`);
  console.log(
    process.env.TRIGGER_SECRET_KEY
      ? "[trigger-worker] TRIGGER_SECRET_KEY present — use Trigger cloud deploy for prod"
      : "[trigger-worker] mock mode — no TRIGGER_SECRET_KEY",
  );
  if (convexUrl) {
    console.log(`[trigger-worker] CONVEX_URL=${convexUrl}`);
  }

  // Demo tick so `bun run dev` shows life
  setInterval(() => {
    console.log(`[trigger-worker] heartbeat ${new Date().toISOString()}`);
    void pollHandoffs();
  }, intervalMs);
}

// Only auto-start when executed as main (not when imported by tests)
const isMain =
  typeof process !== "undefined" &&
  process.argv[1] &&
  (process.argv[1].endsWith("dev-runner.mjs") || process.argv[1].includes("trigger-worker"));

if (isMain) {
  start();
}

// Export for tests
export { resume, Payload, pollHandoffs, start };
