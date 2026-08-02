# Mission Control

Local SEO / digital marketing **agency operating system**.

**Product name:** Mission Control  
**Repo codename:** `agency-os`

## Intent

A single multi-surface workspace (Web, Desktop, TUI, Mobile) plus a user-level Local Agent daemon for technical audits that aim to surpass Screaming Frog / Sitebulb for agency workflows—with a roadmap toward citations, links, CRM, and client portals.

## Status

**Design grilling wrapped** (shared understanding on locked ADRs). Open items: `docs/OPEN-QUESTIONS.md`.

- `CONTEXT.md` — ubiquitous language (glossary only)
- `docs/adr/` — architecture decision records (0001–0046)
- `docs/research/` — research notes
- `docs/OPEN-QUESTIONS.md` — unresolved questions

Implement when you choose to start scaffolding multi-repo Mission Control.

## Locked decisions (summary)

| Topic | Decision |
|-------|----------|
| Tenancy | Multi-tenant SaaS; Agency → Client → Location |
| First ship | Full agency OS: audit + CRM + tasks + email + social + connectivity (ADR-0031) |
| Crawl execution | Local Agent only (no cloud fetch fleet) |
| Surfaces | Web, Desktop, TUI, Mobile — equal; full Audit Loop on each |
| Stack | TanStack Start + Clerk + Convex + Resend; Electron+Effect Desktop; Swift iOS; Kotlin Android; Rust TUI+Agent |
| Agent | User-level OS service (not Electron sidecar) |
| Repos | Separate repos per surface/component + public relations repo (ADR-0017) |
| Contracts | Dedicated protocol repo, semver packages (ADR-0018) |
| Client portal | Auth Client Users; graphs + shared findings (ADR-0025–28) |
| Hosting | Convex + Vercel (ADR-0029) |

See `docs/adr/` for full records (0001–0029).
