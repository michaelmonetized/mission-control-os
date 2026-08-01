# Artifacts are cleaned after Crawl Runs

Local **Artifacts** (raw HTML, intermediate dumps, etc.) are **not retained** across runs as a product feature. After a Crawl Run finishes (and results have been pushed to Convex), the Agent **deletes** that run’s artifact working set from disk.

Ephemeral scratch during the run is allowed; durable truth for Surfaces is **results in Convex** only (ADR-0019).

## Why

- Keeps Agent machines from filling with client HTML.
- Privacy: less residual client content on disk after the job.
- Matches streaming-results model: operators don’t depend on local cache for the Audit Loop.

## Considered

- Keep last N runs / disk budget (A/B/D) — deferred; re-crawl if raw HTML needed again.
- Keep until user purge (C) — disk and privacy risk.

## Consequences

- No offline “open full cached page from last month” without re-crawl (unless a small excerpt was stored in Convex results).
- Failed mid-run cleanup policy: remove partial artifacts on cancel/fail after finalizing whatever results were already streamed (or on next start)—implementation detail must not leave unbounded temp growth.
- Sitebulb-class “historical HTML diff” is out of scope unless later revisited.
