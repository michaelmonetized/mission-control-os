# CRM Automation execution: inline first, Trigger.dev on failure

Automation steps run **inline in the Control Plane mutation / request path first** (original option A)—same transactional neighborhood as the CRM trigger that fired them, when the action can complete quickly (in-DB updates, light fan-out).

**Convex (and co-located app logic) is treated as the higher-reliability plane** for that work. **Trigger.dev is not** used to orchestrate ordinary successful mutation-side automation work.

## Failure handoff

On the **first failure** of an automation step (or of the inline run as a unit—product implements per-step vs whole-run), the system **enqueues recovery to Trigger.dev** (cloud and/or self-host per deploy):

- Retries, backoff, and continued step execution for unreliable I/O (email, SMS, webhooks, flaky providers)
- Does not replace Convex as source of truth for CRM state

## Why

- Happy path stays fast and on the database-backed path whose reliability the team trusts more than Trigger’s.
- Trigger’s value is **durable retry** after failure, not owning every automation run.
- Avoids double systems for simple tag/stage updates that should commit with the trigger.

## Consequences

- Classify actions: **inline-safe** (Convex writes, internal notifies) vs **handoff-prone** (external sends)—both still *try* inline first per this ADR; external sends that fail go to Trigger.
- Idempotency keys required so Trigger retries do not double-send after partial inline success.
- Wait/delay steps longer than request limits must schedule (Convex scheduler and/or Trigger)—document: delays use scheduler; not infinite inline waits.
- Trigger is an execution dependency for failure recovery, not for primary CRM writes.
