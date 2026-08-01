# Application stack: TanStack Start + Clerk + Convex + native + Rust

Supersedes ADR-0009 (Lakebed as Control Plane runtime).

## Decision

| Layer | Choice |
|-------|--------|
| **Web Surface + Control Plane API** | **TanStack Start** (full-stack React) |
| **Auth** | **Clerk** (Users, multi-tenant Agency org model via Clerk Organizations or app-level orgs) |
| **App data + realtime** | **Convex** (reactive queries/mutations; primary store for tenancy, Crawl Run metadata, findings workflow) |
| **Transactional email** | **Resend** |
| **Desktop Surface** | **Electron + Effect** (cross-platform; see [ADR-0011](./0011-desktop-electron-effect.md)) — *originally Swift macOS; superseded* |
| **iOS Surface** | **Swift** |
| **Android Surface** | **Kotlin** |
| **TUI + Local Agent / background crawl tools** | **Rust** |

Sync Fabric is implemented across these clients (WebSocket or Convex subscriptions + dedicated Agent channel for high-volume crawl streams as needed). Local Agent remains the only Site fetcher (ADR-0004).

## Why

- Multi-Surface equality (ADR-0006) needs **real** native and TUI runtimes, not one Preact capsule stretched four ways.
- Lakebed v0 constraints (single client entry, no arbitrary npm/Node in capsule, serialized writes, Google-only first-party auth) fight Agency multi-tenancy, Page Inventory volume, and Agent/TUI/Desktop depth.
- TanStack Start + Clerk + Convex matches existing house stack (Canaveral/Uncap-class) and agent fluency.
- Rust for Agent/TUI: performance, single binary distribution, safe concurrency for crawl workers.
- Swift/Kotlin: first-class Mobile/Desktop UX and OS integration (background Agent on macOS, push, keychain, etc.).

## Considered

- **Lakebed capsule** as entire Control Plane (ADR-0009) — rejected for platform limits vs product bar (ADR-0008).
- **Native Swift Desktop** — superseded by Electron + Effect ([ADR-0011](./0011-desktop-electron-effect.md)) for cross-platform Desktop.
- **TypeScript Agent** — rejected in favor of Rust for background tools/TUI (Electron shell may orchestrate; crawl stays Rust).

## Consequences

- Polyglot monorepo (or multi-repo) and shared protocol/schema contracts are load-bearing (OpenAPI/JSON schema/protobuf — choose later).
- Convex holds operational app state; raw crawl payloads may still need object storage (R2/S3) + Rust-side local cache.
- Desktop = Electron multi-arch builds; Agent = Rust multi-arch sidecars ([ADR-0011](./0011-desktop-electron-effect.md)).
- Resend covers email only; SMS/other channels deferred.
