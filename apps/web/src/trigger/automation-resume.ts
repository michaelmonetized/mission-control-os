/**
 * Trigger.dev task definition (ADR-0046).
 * When TRIGGER_SECRET_KEY is configured, deploy with Trigger CLI.
 * Until then, Convex `automationHandoffs` is the durable queue and this file
 * documents the worker contract.
 *
 * Expected payload:
 * {
 *   automationId: string,
 *   fromStep: number,
 *   reason: string,
 *   idempotencyKey: string,
 *   context?: unknown
 * }
 */

export type AutomationResumePayload = {
  automationId: string;
  fromStep: number;
  reason: string;
  idempotencyKey: string;
  context?: unknown;
  delayMs?: number;
};

export async function resumeAutomationStep(
  payload: AutomationResumePayload,
): Promise<{ ok: boolean; note: string }> {
  // Real worker would:
  // 1. load automation definition from Convex
  // 2. sleep(delayMs) if wait step
  // 3. execute remaining steps with retries
  // 4. mark handoff done via Convex mutation
  console.info("[trigger] resumeAutomationStep", payload);
  if (payload.delayMs && payload.delayMs > 0) {
    await new Promise((r) => setTimeout(r, Math.min(payload.delayMs!, 5_000)));
  }
  return {
    ok: true,
    note: "mock resume — wire @trigger.dev/sdk tasks.trigger('mc-automation-resume')",
  };
}
