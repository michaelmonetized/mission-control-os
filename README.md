# Mission Control

Local SEO / digital marketing **agency operating system**.

**Product name:** Mission Control  
**Repo codename:** `agency-os`

## Intent

A single multi-surface workspace (Web, Desktop, TUI, Mobile) plus a user-level Local Agent daemon for technical audits that aim to surpass Screaming Frog / Sitebulb for agency workflows—with a roadmap toward citations, links, CRM, and client portals.

## Status

**Design / alignment phase.** Domain language and ADRs:

- `CONTEXT.md` — ubiquitous language (glossary only)
- `docs/adr/` — architecture decision records
- `docs/research/` — research notes

Implementation starts only after shared understanding is confirmed in the grill-with-docs session.

## Locked decisions (summary)

| Topic | Decision |
|-------|----------|
| Tenancy | Multi-tenant SaaS; Agency → Client → Location |
| MVP wedge | Technical audit suite (full SF + Sitebulb-class + agency ops bar) |
| Crawl execution | Local Agent only (no cloud fetch fleet) |
| Surfaces | Web, Desktop, TUI, Mobile — equal; full Audit Loop on each |
| Stack | TanStack Start + Clerk + Convex + Resend; Electron+Effect Desktop; Swift iOS; Kotlin Android; Rust TUI+Agent |
| Agent | User-level OS service (not Electron sidecar) |

See `docs/adr/` for full records.
