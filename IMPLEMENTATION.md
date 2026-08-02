# Implementation status vs ADRs / DSDs

Goal: **every ADR and DSD fully satisfied** in code. Monorepo is pragmatic (ADR-0017 split later).

## Layout

```
apps/web          — TanStack Router + Vite + Clerk + Convex + design system + /api
apps/desktop      — Electron + safeStorage Agent Token + install IPC
apps/agent        — Rust Local Agent (daemon, crawl, installers)
apps/tui          — Rust Mocha ANSI cockpit
packages/tokens   — Mocha, Flamingo/Sky, φ scale, Max CSS, glass
packages/protocol — Shared types + API path catalog
apps/web/convex   — Schema + domain functions
docs/adr · docs/dsd
```

## Live platform

| Service | Status |
|---------|--------|
| Clerk | Mission Control OS · orgs · JWT `convex` |
| Convex | hustle-testing/mission-control-os · dev + prod |
| Vercel | Preview free minutes only; **main Git deploys disabled** |
| Resend | Key from `~/Projects/.env.shared` on Convex + Vercel |

## ADR matrix

| ADR | Decision | Implementation |
|-----|----------|----------------|
| **0001** Multi-tenant SaaS | Agencies from day one | Clerk orgs + Convex `agencies` |
| **0002** Hierarchy | Agency → Client → Location → Site | `hierarchy.ts` + Clients UI |
| **0003** Audit wedge | Crawl + a11y-class findings | `crawl` + `findings` + Audit UI |
| **0004** Local agent only | No cloud crawler | `mc-agent crawl` / daemon |
| **0005** Multi-surface CP | Web/Desktop/TUI/Mobile | Web live; Desktop/TUI; mobile deferred scaffold |
| **0006** All surfaces equal | Same capabilities | Shared protocol + Convex; TUI/Desktop stubs wired |
| **0007** Full audit loop | Every surface | Web + Agent; TUI navigation; portal graphs |
| **0008** Crawl depth | SF+Sitebulb-class | HTTP crawl + missing alt/broken links; Playwright path |
| **0009** Lakebed | **Superseded** by 0010 | N/A |
| **0010** Stack | TanStack + Clerk + Convex + Rust | Live |
| **0011** Desktop Electron+Effect | Cross-platform | Electron shell + pairing; Effect runtime TODO |
| **0012/0013** User-level daemon | LaunchAgent/systemd/user task | `apps/agent/install/*` |
| **0014** Mission Control | Name | Branding |
| **0015** Clerk orgs = Agency | | ClerkProvider + AgencyGate |
| **0016** Agent token via Desktop | | `agent.issueToken` + safeStorage + config.json |
| **0017** Multi-repo | Later | Monorepo OK |
| **0018** Protocol repo | Shared contracts | `packages/protocol` |
| **0019** Artifacts local / results Convex | | Agent artifacts + streamFinding |
| **0020** Cleanup after runs | | `cleanup_artifacts` in crawl.rs |
| **0021** Robots + override | | robots.txt parse + ignore flag |
| **0022** JS render default | | Playwright when available; HTTP fallback |
| **0023** Finding statuses | open…false_positive | `findings.setStatus` + Audit UI |
| **0024** Metrics time series | | `metricsSnapshots` + graphs |
| **0025–0027** Portal login/invite | | `/portal` + grants/allowlist |
| **0028** Portal graphs + shared | | portal metrics + shared findings |
| **0029** Convex + Vercel | | Deployed; main builds off |
| **0030** Beyond audit | Full OS | CRM/tasks/social/email/auto |
| **0031** Full agency OS | | Module routes + schema |
| **0032–0033** Dual CRM + channels | | `crm.ts` + CRM UI |
| **0034** Public CRM API | | protocol paths + public-crm-api.ts |
| **0035** Tasks/projects | | `tasks.ts` + Tasks UI |
| **0036** Resend ESP | | `email.ts` provision/verify |
| **0037–0038** Social calendar | | `social.ts` + UI |
| **0039** Connected accounts | | `connections.ts` + UI |
| **0040–0041** Onboarding | | Agency onboarding + portal claim |
| **0042** API paths | no version | protocol + vite middleware |
| **0043–0044** Automations | | builder UI + automations.ts |
| **0045** Admin/Member | | org roles + portal roles |
| **0046** Inline then Trigger | | `runInline` + trigger-handoff.ts |

## DSD matrix

| DSD | Status |
|-----|--------|
| 0001 Personality | Sparse cockpit copy + glass |
| 0002 Visual foundations | tokens/theme.css glass/neon/neu |
| 0003 Flamingo/Sky | CSS vars + components |
| 0004 Neue Haas / Max | public/max fonts + max.css |
| 0005 Radius nesting | --radius-* tokens |
| 0006 Launch keyhole | brand SVGs + LogoLockup |
| 0007–0010 shadcn mirror | components/ui + mc mirrors |
| 0008 Media kit source | docs/dsd/media + public/brand |
| 0009 φ scale | tokens from cna |
| **0011 Command palette** | ⌘K + vim j/k CommandPaletteHost |

## Run

```bash
bun install
# apps/web/.env.local — Clerk + Convex + RESEND from ~/Projects/.env.shared
cd apps/web && bunx convex dev   # terminal 1
bun run dev:web                  # terminal 2
cargo run -p mc-agent -- crawl --origin https://example.com --mode http_only
cargo run -p mc-tui
```

## Remaining gaps (honest)

| Item | Gap |
|------|-----|
| ADR-0006 mobile | **Scaffold** iOS SPM + Android Compose (`apps/ios`, `apps/android`) — Clerk/Convex wire TBD |
| ADR-0011 Effect | Desktop bootstrap orchestration + `effect` dep; expand graph over time |
| ADR-0008 full Sitebulb depth | Expanded checks + agent HTTP poll/claim/complete; more extractors TBD |
| ADR-0034 HTTP CRM proxy | Catalog + Convex SoT; thin HTTP dual-write optional |
| ADR-0046 Trigger.dev cloud | Handoffs queue + `@mc/trigger-worker` dev runner; cloud key TBD |
| ADR-0022 Playwright | Default when `require('playwright')` works; else HTTP |
| DSD-0008 iCloud vector | Reconstructed SVG until iCloud import |
| DSD-0010 full shadcn dump | Dialog fully mirrored; expand rest via `shadcn add` |
| Clerk production instance | Dev keys on Vercel previews |
| ADR-0017 multi-repo split | Deferred intentionally |

## Cost control

See `docs/deploy-vercel-cost.md` — never auto-build production from `main`; previews only.
