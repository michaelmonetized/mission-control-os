# Crawl artifacts local; results stream to Convex

During and after a Crawl Run:

| Data | Where |
|------|--------|
| **Artifacts** (raw HTML/bodies, link graphs intermediate files, render dumps, etc.) | **Local machine only** — disk under the Agent’s user-level data directory |
| **Results** (Page Inventory rows, Audit Findings, Issue Clusters, progress, status, scores) | **Convex**, pushed **incrementally as they arrive** over the Agent → Control Plane channel |

There is **no** first-party cloud object store (R2/S3) for crawl artifacts in this decision. Surfaces read live/completed results from Convex; they do not require remote blob access for the default Audit Loop.

## Why

- Matches Local Agent–only execution (ADR-0004): heavy bytes stay next to the spider.
- Convex stays the multi-surface source of truth for **operator-visible** state without becoming a blob warehouse.
- Incremental push enables live progress on Web/Desktop/TUI/Mobile (ADR-0007).

## Considered

- Cloud object storage for artifacts (A/C) — deferred; adds cost and privacy surface.
- Convex-only for raw HTML (D) — size/cost/latency unfit for SF-class crawls.
- Local-only with no Convex stream — breaks multi-surface live loop.

## Consequences

- “View cached page” / full HTML re-analysis may require the **Agent online** on that machine or a re-crawl; not guaranteed from Convex alone unless a derived excerpt is stored in results.
- Historical Crawl Run compare (ADR-0008) compares **result snapshots in Convex**, not necessarily full local artifact trees (artifacts may be pruned per retention policy on disk).
- Agent disk retention policy is product-owned (e.g. keep last N runs, max GB).
- Privacy: client HTML stays on agency hardware by default—marketing-friendly constraint.
