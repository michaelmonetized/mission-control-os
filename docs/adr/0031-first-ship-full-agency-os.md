# First ship is full agency OS (GHL-class breadth)

The **first product ship** includes the full Mission Control surface area already designed for audit **plus**:

- **CRM** (Client/org/contact relationships and pipelines as productized)
- **Task queue** (work management for agency delivery)
- **Email** (agency email workflows—not merely Resend system mail)
- **Social calendar** (Buffer-class scheduling)
- **Connectivity** (integrations / connected accounts)
- **Onboarding flows** (Agency and Client setup paths)
- Plus existing: multi-surface Control Plane, Local Agent audits, Client Portal, metrics history

This **supersedes** any reading of ADR-0003 as “audit-only first release.” ADR-0003 remains the description of the **audit capability**; ADR-0031 sets **release breadth**.

## Why

User explicitly chose full GHL-class first ship (option D) so the product is a complete agency OS at launch, not a spider with a roadmap tease.

## Consequences

- Highest possible schedule and staffing risk; requires modular architecture and ruthless vertical slices *inside* the full scope (shared tenancy, task queue, CRM core, then email/social).
- API structure and naming conventions must be domain-wide from day one (protocol repo).
- Agent remains audit execution only unless later ADRs extend it; email/social likely use other workers/connectors.
- Quality bar: each module must be usable, not checkbox-empty.
