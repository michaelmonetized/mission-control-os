# Client portal with login is in MVP

MVP includes a **client-facing portal** where Client stakeholders sign in (Clerk) and use authorized Mission Control data for their Client.

**Later expansion (ADR-0032):** Client experience is **full Client CRM** (conversation-centric), not audit-only. Audit graphs/shared findings (ADR-0024/0028) remain required modules inside that experience.

## Scope (MVP floor, as amended)

- Authenticated **Client Users** (distinct from Agency staff roles)
- Access scoped to their **Client** (and Locations under it)—never other Agencies’ data
- **Client CRM** + metrics graphs + shared audit findings
- Agency staff invite/manage Client Users

## Out of scope unless later ADRs expand

- Client-triggered crawls (default: agency-operated Agent) unless explicitly enabled
- Access to Agency CRM or other Clients’ CRM Workspaces

## Why

- Agencies need to *show* technical progress under retainer; login portal is the durable delivery surface for graphs (28→0 broken links over dates).
- Export-only or magic links alone were rejected for MVP (user chose full portal login).

## Consequences

- Clerk model: Agency = Organization (ADR-0015); Client Users need a clear membership pattern (e.g. org membership with Client-scoped role, or separate authz mapping Client User → Client ids in Convex). Must not grant Agency admin.
- Portal is another Surface in the multi-surface mesh (Web-first portal UX; mobile may reuse).
- Expands MVP beyond pure audit tooling—schedule risk accepted with the full-depth bar (ADR-0008).
