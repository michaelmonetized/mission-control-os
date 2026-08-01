# Per-run findings plus durable metrics history for graphs

## Finding identity

- Each Crawl Run produces **immutable (or append-only) finding rows** for that run—complete per-run fact history.
- A separate **open-issues rollup** (fingerprint of Site + finding type + URL/key fields) supports “what’s still open” without destroying run history.
- Status workflow (ADR-0023) applies to the rollup and/or run-instance as implemented, without erasing historical run rows.

## Metrics time series

Every Crawl Run also writes **aggregate metric snapshots** (and keeps them forever unless an Agency purges data) so agencies can chart progress over calendar time, e.g.:

- broken internal links: 28 → 22 → 13 → 7 → 0  
- images missing alt: 14 → 11 → 3 → 0 → 0  
- with **dates** (run completed-at) on the X axis  

Examples of snapshot counters (non-exhaustive): finding counts by type/severity, page counts, duplicate %, indexable counts, a11y issue totals—whatever the audit suite emits. Graphs read **snapshots**, not recomputation over raw Artifacts (artifacts are ephemeral, ADR-0020).

## Why

- Agencies sell retainers with “we fixed your technical debt” narratives; time-series proof is product-critical.
- Per-run findings alone don’t make charts easy; dedicated aggregates keep graphs fast and stable.
- Rollup open issues without losing forensic per-run detail (option C + history).

## Consequences

- Control Plane stores: Crawl Run, Finding (per run), FindingFingerprint/OpenIssue (rollup), **CrawlMetricsSnapshot** (per run aggregates).
- Retention: metrics snapshots and run summaries are long-lived in Convex (or derived store); not cleaned with local Artifacts.
- Protocol repo defines snapshot schema so all Surfaces chart the same series.
