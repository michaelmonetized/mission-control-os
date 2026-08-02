# Web / Control Plane hosting: Convex + Vercel

The Mission Control web app (TanStack Start) and Control Plane HTTP surface deploy on **Vercel**. Application data, reactive queries/mutations, and live result streams use **Convex**.

Clerk, Resend, and other SaaS stay as external services. Local Agent and native Surfaces are not hosted here.

## Why

- Standard pairing for TanStack/Clerk/Convex stacks and existing house familiarity.
- Clear split: Vercel for web delivery, Convex for realtime app state (findings, metrics, tenancy metadata).

## Considered

- Cloudflare Pages/Workers (B) — fine alternative; not chosen.
- Defer hosting (D) — rejected; hosting affects auth callbacks and env layout.

## Consequences

- Preview deployments + production env for Clerk/Convex URLs.
- Agent and Desktop talk to production/preview Control Plane URLs via config, not localhost Convex only.
- File/blob: still local Agent artifacts (ADR-0019); no Vercel blob required for crawl HTML.
