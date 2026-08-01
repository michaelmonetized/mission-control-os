# Shared contracts live in a protocol repository

Cross-surface types and wire formats for Mission Control live in a dedicated **`mission-control-protocol`** repository (exact name TBD), not embedded only in the Control Plane or duplicated ad hoc.

## What it owns

- Control Plane HTTP/API contracts (OpenAPI or equivalent)
- Agent ↔ Control Plane protocol (auth, job lease, progress, page records, findings ingest)
- Shared event/DTO schemas consumed by Web, Desktop, TUI, iOS, Android, Agent
- Versioned artifacts: e.g. npm package for TypeScript, crate (or git-tagged codegen) for Rust, optional codegen for Swift/Kotlin

## Why

- Multi-repo topology (ADR-0017) makes a single contract source of truth mandatory.
- Semver on protocol packages lets surfaces upgrade independently without silent drift.
- Agent Token, Crawl Run, Audit Finding, and Sync Fabric payloads stay aligned.

## Considered

- Contracts only in Control Plane repo (B) — couples mobile/agent releases to web.
- Contracts in design/`agency-os` repo (C) — mixes product docs with publish pipeline.
- Duplicate + CI only (D) — drift risk too high for polyglot MVP.

## Consequences

- Protocol changes are explicit version bumps; breaking changes require coordinated surface upgrades.
- CI in each product repo pins a protocol version and runs compatibility checks.
- Codegen pipeline is part of “definition of done” for new endpoints/events.
