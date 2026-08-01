# Control Plane runtime: Lakebed

**Status: superseded by [ADR-0010](./0010-stack-tanstack-native-rust.md).**

The Control Plane is built on **[Lakebed](https://docs.lakebed.dev/)** — an agent-native TypeScript capsule runtime (server schema/queries/mutations/endpoints + reactive client subscriptions + built-in auth + hosted deploy), not TanStack+Convex or a hand-rolled Postgres stack as the primary app platform.

**Why:** Aligns with agent-driven build velocity, integrated DB + live queries + deploy, and a single capsule contract for the multi-tenant OS core.

**Considered:** TanStack Start + Convex + Clerk (A); TanStack Start + Postgres + custom Sync Fabric (B); separate realtime bus (C). User selected Lakebed over those options.

**Known platform constraints (v0 docs — design must absorb, not ignore):**
- Capsule shape is **one** `server/index.ts` and **one** Preact `client/index.tsx` by default; arbitrary npm and Node built-ins inside capsule modules are not supported yet.
- Auth is **Lakebed Auth** (guest + Google first-party), not Clerk/orgs out of the box—Agency multi-tenancy must be modeled in app data + authorization, not assumed from the platform.
- DB writes are **serialized per deploy** in v1; high-volume Crawl Run ingestion may need batching, external object storage for raw page payloads, or a side channel for Agent streams.
- Local Agent, Desktop shell, TUI, and native Mobile are **outside** a pure capsule client; they must attach via Lakebed endpoints, tokens, and/or a Sync Fabric that the capsule owns or fronts.

**Consequences:** Product Surfaces (ADR-0005/0006) are not “four Lakebed apps”; they are clients of one Control Plane capsule (or a small set of capsules if Lakebed later allows). Crawl bytes and Agent process stay off-capsule (ADR-0004). Revisit this ADR if Lakebed limits block Page Inventory scale or multi-Surface parity.
