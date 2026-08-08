# Mission Control

Local SEO / digital marketing **agency operating system**.

**Product name:** Mission Control  
**Repo:** `mission-control-os`  
**GitHub:** https://github.com/michaelmonetized/mission-control-os

## Quick start

```bash
bun install
bun run dev:web    # http://127.0.0.1:5173
```

Agent:

```bash
cargo run --manifest-path apps/agent/Cargo.toml -- paths
cargo run --manifest-path apps/agent/Cargo.toml -- heartbeat
cargo run --manifest-path apps/agent/Cargo.toml -- daemon
```

Desktop (loads web URL):

```bash
# terminal 1: bun run dev:web
# terminal 2:
cd apps/desktop && bun install && bun run dev
```

## Monorepo

| Path | Role |
|------|------|
| `apps/web` | Sparse cockpit UI (TanStack Router, Vite, design system, `/api/*`) |
| `apps/desktop` | Electron shell |
| `apps/agent` | Rust Local Agent daemon |
| `apps/tui` | Rust TUI stub |
| `packages/tokens` | Mocha, Flamingo/Sky, φ scale, Max CSS, glass |
| `packages/protocol` | Shared types + API paths |
| `apps/web/convex/schema.ts` | Full domain Convex schema |
| `docs/adr` | Architecture decisions |
| `docs/dsd` | Design system docs |
| `IMPLEMENTATION.md` | ADR → code map |

## Design system (locked)

- Sparse cockpit · glass over Catppuccin Mocha · neon · neumorph · skeuomorph controls  
- Flamingo `#f2cdcd` + Sky `#89dceb`  
- Neue Haas Grotesque Pro (`max*.ttf`)  
- Launch keyhole logo + max95 wordmark  
- shadcn untouched + MC mirrors + **cnfast**  
- Radius nesting `calc(radius + padding)` · φ spacing from cna  

## Status

Architecture + DSD grill complete. **Live Clerk (Agency = Org), Convex (dev + prod), and Vercel** are wired for the web cockpit. Production crawl engine, Resend ESP, Trigger.dev, and mobile apps are next.

### Platform

| | |
|--|--|
| Production web | https://mission-control-os-zeta.vercel.app |
| Convex dashboard | https://dashboard.convex.dev/t/hustle-testing/mission-control-os |
| Clerk app | Mission Control OS (orgs enabled, JWT template `convex`) |

### Env

```bash
# Prefer apps/web/.env.local for Vite
cp .env.example apps/web/.env.local
clerk link --app <app_id> && clerk env pull --file apps/web/.env.local
# Then rename publishable key to VITE_CLERK_PUBLISHABLE_KEY if needed
cd apps/web && bunx convex dev --once   # writes VITE_CONVEX_URL
```
