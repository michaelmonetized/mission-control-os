# Multi-repo layout + public relations repo

Implementation lives in **separate repositories per major surface/component**, not a monorepo. In addition, there is a dedicated **public relations (PR / marketing / devrel)** repository.

## Intended repos (illustrative names)

| Repo | Contents |
|------|----------|
| Control Plane / Web | TanStack Start, Convex, Clerk integration, Resend |
| Desktop | Electron + Effect |
| iOS | Swift |
| Android | Kotlin |
| Agent | Rust Local Agent daemon |
| TUI | Rust TUI (may share crates with Agent via published packages or git deps) |
| **Public relations** | Marketing site, launch assets, docs site, press/devrel—not product runtime |

Exact package names TBD; this ADR fixes **topology**, not npm/cargo names.

## Why

- Independent versioning, CI, and release (Electron notarization, App Store, Rust binary, web deploy).
- Clear ownership boundaries across polyglot stacks.
- Public relations work stays out of product runtime repos.

## Considered

- Single monorepo (A) — simpler protocol PRs; rejected.
- Split groups (B/D) — middle ground; rejected in favor of full separation + PR repo.

## Consequences

- **Shared contracts** (API schemas, Agent protocol, event types) need an explicit home: either a small `mission-control-protocol` / OpenAPI package published to registry, or duplicated with CI contract tests. Must be decided before implementation (follow-up).
- Cross-cutting changes require multi-repo PRs or a versioned protocol release.
- This design-grilling repo (`agency-os`) remains the **docs/ADR/CONTEXT** home until/unless moved into a `mission-control` meta or docs repo.
