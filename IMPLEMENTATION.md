# Implementation status vs ADRs / DSDs

Scaffold in-repo monorepo (pragmatic; multi-repo ADR-0017 can split later).

## Layout

```
apps/web          — TanStack Router + Vite + design system + /api middleware
apps/desktop      — Electron shell loading web (ADR-0011)
apps/agent        — Rust Local Agent daemon (ADR-0004/0012/0013)
apps/tui          — Rust TUI stub
packages/tokens   — Mocha, Flamingo/Sky, φ scale, Max CSS, glass utilities
packages/protocol — Shared types + API path catalog (ADR-0018/0042)
convex/schema     — Full domain schema in apps/web/convex/schema.ts
docs/adr          — Architecture
docs/dsd          — Design system
```

## Live platform wiring (2026-08-02)

| Service | Status |
|---------|--------|
| **Clerk** | App `Mission Control OS` · orgs enabled · JWT template `convex` · linked via CLI |
| **Convex** | Team `hustle-testing` project `mission-control-os` · dev `gallant-mosquito-596` · prod `precise-anteater-354` |
| **Vercel** | Project `mission-control-os` · prod https://mission-control-os-zeta.vercel.app |

### Local setup

```bash
bun install
# Env: apps/web/.env.local (Clerk + Convex) — also root .env.local for CLIs
clerk env pull --file .env.local   # refresh Clerk keys if needed
cd apps/web && bunx convex dev     # watch functions / codegen
bun run dev:web                    # http://127.0.0.1:5173
```

## ADR coverage (code)

| ADR | Status |
|-----|--------|
| 0001–0003 multi-tenant / hierarchy / audit wedge | Schema + UI modules |
| 0004 local agent only | Agent crate streams design; no cloud crawler |
| 0005–0007 multi-surface / equal / audit loop | Web surfaces; desktop/tui stubs; mobile later |
| 0008 full crawl depth | Schema findings/metrics; UI graphs; Agent run stub |
| 0010 TanStack/Clerk/Convex/Rust | **Live Clerk + Convex wired**; TanStack Router SPA |
| 0011 Electron | apps/desktop loads web URL |
| 0012–0013 user daemon | systemd unit + agent binary |
| 0014 Mission Control name | Branding throughout |
| 0015–0016 Clerk org + agent token API | **ClerkProvider + Agency=Org + roles**; API `/api/agent/token` stub |
| 0017 multi-repo | Monorepo bootstrap; split when ready |
| 0018 protocol | packages/protocol |
| 0019–0020 artifacts local cleanup | Agent data dir; **Convex crawl stream mutations** |
| 0021–0022 robots / rendered | Crawl API body fields |
| 0023–0024 findings + metrics | Schema + audit UI series + Convex findings/metrics |
| 0025–0028 portal | **/portal** + Convex grants/allowlist + claim flow |
| 0029 Convex+Vercel | **Deployed** schema + Vercel prod/preview env |
| 0031–0036 full OS modules | Routes + schema for CRM/tasks/email/social |
| 0037–0039 social + connections | Routes + schema |
| 0040–0041 onboarding | /onboarding + `agencies.ensureMine` Self Client |
| 0042 API style | vite API middleware (fallback); Convex primary for clients |
| 0043–0046 automations | Routes + schema; Trigger handoff documented |
| DSD 0001–0011 | tokens, logo SVG, Max fonts, cnfast, mirrors |

## Run

```bash
cd mission-control-os
bun install
bun run dev:web          # http://127.0.0.1:5173
bun run dev:convex       # optional second terminal
cargo run -p mc-agent -- paths
cargo run -p mc-agent -- heartbeat
```

## Not yet production-complete

- Clerk production instance (currently dev keys on Vercel)
- Resend ESP live provision (issue #3)
- Full crawl engine (Playwright) inside Agent
- Real Trigger.dev worker wiring
- Effect orchestration on Desktop
- Swift/Kotlin apps
- Full shadcn registry dump (core + mirrors present; expand with `shadcn add`)
- iCloud vector replace for SVG (current SVG is reconstructed mark)
- Machine auth for Agent → Convex stream (today uses staff session path)
