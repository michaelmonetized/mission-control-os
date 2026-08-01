# Client portal with login is in MVP

MVP includes a **client-facing portal** where Client stakeholders sign in (Clerk) and see authorized Mission Control data—at minimum **Metrics Snapshot graphs and progress over time** for their Client/Locations (ADR-0024), not only agency-internal views or export.

## Scope (MVP floor)

- Authenticated **Client Users** (distinct from Agency staff roles)
- Access scoped to their **Client** (and Locations under it)—never other Agencies’ data
- Read-oriented portal: overtime charts, high-level Audit Loop outcomes as product allows
- Agency staff invite/manage Client Users

## Out of scope unless later ADRs expand

- Full GHL-class marketing automation inside the portal
- Client-triggered crawls (default: agency-operated Agent)
- Editing Agency internal notes/findings workflow beyond what is explicitly shared

## Why

- Agencies need to *show* technical progress under retainer; login portal is the durable delivery surface for graphs (28→0 broken links over dates).
- Export-only or magic links alone were rejected for MVP (user chose full portal login).

## Consequences

- Clerk model: Agency = Organization (ADR-0015); Client Users need a clear membership pattern (e.g. org membership with Client-scoped role, or separate authz mapping Client User → Client ids in Convex). Must not grant Agency admin.
- Portal is another Surface in the multi-surface mesh (Web-first portal UX; mobile may reuse).
- Expands MVP beyond pure audit tooling—schedule risk accepted with the full-depth bar (ADR-0008).
