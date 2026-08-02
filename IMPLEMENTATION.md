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

## ADR coverage (code)

| ADR | Status |
|-----|--------|
| 0001–0003 multi-tenant / hierarchy / audit wedge | Schema + UI modules |
| 0004 local agent only | Agent crate streams design; no cloud crawler |
| 0005–0007 multi-surface / equal / audit loop | Web surfaces; desktop/tui stubs; mobile later |
| 0008 full crawl depth | Schema findings/metrics; UI graphs; Agent run stub |
| 0010 TanStack/Clerk/Convex/Rust | TanStack Router web; Convex schema; Clerk keys in .env.example |
| 0011 Electron | apps/desktop |
| 0012–0013 user daemon | systemd unit + agent binary |
| 0014 Mission Control name | Branding throughout |
| 0015–0016 Clerk org + agent token API | API `/api/agent/token`; Clerk env example |
| 0017 multi-repo | Monorepo bootstrap; split when ready |
| 0018 protocol | packages/protocol |
| 0019–0020 artifacts local cleanup | Agent data dir + cleanup notes in agent |
| 0021–0022 robots / rendered | Crawl API body fields |
| 0023–0024 findings + metrics | Schema + audit UI series |
| 0025–0028 portal | Portal route + schema grants |
| 0029 Convex+Vercel | Schema ready; deploy web to Vercel |
| 0031–0036 full OS modules | Routes + schema for CRM/tasks/email/social |
| 0037–0039 social + connections | Routes + schema |
| 0040–0041 onboarding | /onboarding Self Client spine |
| 0042 API style | vite API middleware |
| 0043–0046 automations | Routes + schema; Trigger handoff documented |
| DSD 0001–0011 | tokens, logo SVG, Max fonts, cnfast, mirrors |

## Run

```bash
cd mission-control-os
bun install
bun run dev:web          # http://127.0.0.1:5173
cargo run -p mc-agent -- paths
cargo run -p mc-agent -- heartbeat
```

## Not yet production-complete

- Live Clerk/Convex/Resend credentials and deployments
- Full crawl engine (Playwright) inside Agent
- Real Trigger.dev worker wiring
- Effect orchestration on Desktop
- Swift/Kotlin apps
- Full shadcn registry dump (core + mirrors present; expand with `shadcn add`)
- iCloud vector replace for SVG (current SVG is reconstructed mark)
