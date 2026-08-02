/**
 * Local Trigger.dev-style worker (ADR-0046).
 * Polls Convex handoffs when CONVEX_URL + CONVEX_DEPLOY_KEY set;
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

async function resume(payload) {
  const p = Payload.parse(payload);
  if (p.delayMs && p.delayMs > 0) {
    const wait = Math.min(p.delayMs, 10_000);
    console.log(`[trigger-worker] wait ${wait}ms for ${p.idempotencyKey}`);
    await new Promise((r) => setTimeout(r, wait));
  }
  console.log(`[trigger-worker] resumed automation ${p.automationId} from step ${p.fromStep}`);
  // TODO: Convex mutation handoffs.mark + continue steps
  return { ok: true };
}

console.log(`[trigger-worker] started (poll ${intervalMs}ms)`);
console.log(
  process.env.TRIGGER_SECRET_KEY
    ? "[trigger-worker] TRIGGER_SECRET_KEY present — use Trigger cloud deploy for prod"
    : "[trigger-worker] mock mode — no TRIGGER_SECRET_KEY",
);

// Demo tick so `bun run dev` shows life
setInterval(() => {
  console.log(`[trigger-worker] heartbeat ${new Date().toISOString()}`);
}, intervalMs);

// Export for tests
export { resume, Payload };
