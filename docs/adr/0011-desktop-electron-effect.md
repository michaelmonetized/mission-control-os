# Desktop Surface: Electron + Effect (cross-platform)

Amends [ADR-0010](./0010-stack-tanstack-native-rust.md): **macOS Desktop is not Swift.**

## Decision

| Surface | Choice |
|---------|--------|
| **Desktop** (macOS, Windows, Linux; arm64 + x64) | **Electron** app, application logic with **Effect** (Effect-TS style, as in t3code-class tooling) |
| **iOS** | **Swift** (unchanged) |
| **Android** | **Kotlin** (unchanged) |
| **TUI + Local Agent / background tools** | **Rust** (unchanged) |
| **Web / Control Plane** | TanStack Start + Clerk + Convex + Resend (unchanged) |

Desktop is **one codebase**, multi-arch via CI build matrix (not separate Swift/Windows stacks). The Desktop app installs, updates, and supervises the **Rust Local Agent** (sidecar binary per platform/arch) and participates fully in the Audit Loop and Sync Fabric.

## Why

- Cross-platform Desktop is required for SEO agency reality (Windows + Mac) without maintaining two native desktop UIs.
- Electron + Effect matches known product patterns (e.g. t3code-class desktop): typed effects, structured concurrency, testable runtime for long-lived desktop processes (Agent lifecycle, IPC, reconnect).
- Swift remains appropriate for **iOS** only; forcing Swift for Desktop conflicted with Windows MVP needs.

## Consequences

- Electron pack size and security surface are accepted costs; harden IPC and Agent spawn paths.
- Desktop CI must produce arm64/x64 (and universal where applicable) artifacts for Mac/Windows/Linux.
- Shared UI may lean on web tech inside Electron (React) aligned with TanStack web patterns, while Effect owns main-process / service orchestration.
- Rust Agent is still platform-specific **binaries** bundled or downloaded by the Electron shell—not rewritten in TS.
