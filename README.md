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

Architecture + DSD grill complete. Implementation scaffold satisfies structure and happy-path UI/API; production crawl engine, live Clerk/Convex/Resend, and mobile apps are next.

Copy `.env.example` → `.env` for real credentials.
