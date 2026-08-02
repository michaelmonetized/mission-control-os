# Client Portal shows graphs plus Agency-shared findings

Client Portal content (MVP) for a granted Client:

1. **Metrics Snapshot graphs** over time (ADR-0024)—issue counts by type/date, etc.
2. **Summary context** as needed (totals/severity rollups derived from snapshots).
3. **Read-only Audit Findings** (and/or Open Issues) that Agency staff have explicitly marked **shared** with the Client—not the full internal finding set by default.

Not in portal by default: internal notes, non-shared findings, Agent controls, other Clients, Agency billing.

## Why

- Graphs prove retainer progress; shared findings answer “what’s left / what we fixed” without exposing full triage (Won’t fix debates, false-positive noise, internal status).
- Full agency Audit Loop for clients (D) overshares; graphs-only (A) under-serves.

## Consequences

- Findings (or Open Issues) need a **shared** (or visibility) flag controlled by Agency Users.
- Portal queries filter `shared == true` + Client ACL (ADR-0026).
- Default on new findings: **not shared** until Agency publishes/shares.
