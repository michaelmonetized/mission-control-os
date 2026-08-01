# Clerk Organizations are Agencies

Each **Agency** (SaaS tenant) is a **Clerk Organization**. Human **Users** authenticate with Clerk and act inside an Organization. Roles/permissions for agency staff use Clerk org membership (and app checks where needed).

**Client**, **Location**, **Site**, Crawl Runs, and Audit Findings live in **Convex** (and related storage), keyed by Agency/org id—not as Clerk entities.

## Why

- First-class multi-tenant B2B shape (ADR-0001) with seats, invites, and org switching.
- Avoid reinventing org membership while keeping SEO domain data in Convex.
- Aligns with Clerk + TanStack Start house patterns.

## Considered

- Agency only in Convex (B) — more app code, weaker invite/billing integration.
- Hybrid personal workspaces (C) — deferred.
- Defer Clerk Orgs (D) — migration tax later.

## Consequences

- Every Control Plane request is scoped by active Clerk `orgId` (Agency).
- Local Agent must obtain tokens that carry org context (user session or org-scoped machine credential)—protocol TBD.
- Billing/plans can attach to Clerk org later; not required for audit MVP.
- Solo operators still create an Organization (even a one-person Agency).
