# Audit Finding statuses are simple live Convex fields

Audit Findings are Convex documents (or equivalent reactive rows) updated in real time. **Status is a field**, not a separate workflow engine, job queue, or multi-step orchestration product.

## Status set (MVP)

| Status | Meaning |
|--------|---------|
| **Open** | New / unhandled |
| **Triaged** | Seen, prioritized or categorized |
| **In progress** | Someone is working it |
| **Done** | Fixed or accepted complete |
| **Won’t fix** | Explicitly declined |
| **False positive** | Not a real issue |

Agent **streams findings as discovered** into Convex (ADR-0019). Humans (any Surface) flip status via mutations; Convex reactivity is the Sync Fabric for status—no extra “workflow service.”

## Why

- Full agency-useful lifecycle (option C) without overengineering.
- Matches multi-surface live data: tunnel/subscriptions already carry document changes.
- Avoids batch-only “report finished then edit” mental model.

## Not in scope for this ADR

- Custom status schemes per Agency
- Mandatory transitions / approval gates
- External ticket sync (Jira/Linear) as a hard dependency
- Complicated state machines or temporal workflows

## Consequences

- UI is filters + status chips + assignees (assignee optional follow-up), not a BPM tool.
- Historical Crawl Runs keep findings; status is ongoing work state on the finding identity (define identity: per URL+type across runs vs per-run instance—default **per Crawl Run instance**, with optional “still open on Site” views later).
