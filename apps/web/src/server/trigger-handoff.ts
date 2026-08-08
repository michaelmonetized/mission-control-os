/**
 * Trigger.dev failure handoff (ADR-0046).
 * Inline automation runs first; on failure we enqueue a durable job.
 * Wire TRIGGER_SECRET_KEY + real SDK when project is provisioned.
 */

export type TriggerHandoffPayload = {
  automationId: string;
  fromStep: number;
  reason: string;
  idempotencyKey?: string;
  context?: unknown;
};

export async function enqueueAutomationHandoff(
  payload: TriggerHandoffPayload,
): Promise<{ queued: boolean; mock: boolean; id?: string }> {
  const key = process.env.TRIGGER_SECRET_KEY;
  if (!key) {
    console.info("[trigger-handoff] mock queue", payload);
    return { queued: true, mock: true, id: `mock_${Date.now()}` };
  }

  // Placeholder for @trigger.dev/sdk tasks.trigger("mc-automation-resume", payload)
  console.info("[trigger-handoff] would enqueue to Trigger.dev", {
    automationId: payload.automationId,
    fromStep: payload.fromStep,
  });
  return { queued: true, mock: false, id: `trigger_pending_${payload.automationId}` };
}
