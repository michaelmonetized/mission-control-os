# One Task system: CRM nurturing vs Client PM via flags, tags, and Projects

## Single Task primitive

There is **one Task** model (option C), not separate databases for “CRM tasks” vs “PM tasks.” **Flags, tags, and links** control **visibility and routing** between surfaces:

| View | Purpose | Typical links |
|------|---------|----------------|
| **CRM nurturing tasks** | Sales accountability and support/agent delegation while **acquiring or retaining** relationships | Contact, Company, Conversation, Opportunity, CRM Workspace |
| **Client PM queue** | Agency delivery work **per Client** (project management)—not per Contact | **Client**, **Project**, Location, Site, Audit Finding, Campaign |

Workers can **re-route** work: e.g. promote or move a Task that outgrew CRM support into a **Project** under the Client PM view (flags/tags + Project membership change). No duplicate task product.

## Projects

- A **Project** is a first-class container of Tasks for delivery work.
- Any real-world **company or domain** may map to one or more delivery **Clients** / Companies and may have **any number of Projects**, each with **any number of Tasks**.
- PM queue is **per Client** (tenancy/delivery account), not per Contact.
- CRM Workspaces still use Tasks for sales/support; those stay visible in CRM until routed to PM.

## Why

- Sales/support accountability ≠ multi-project delivery; same engine, different lenses.
- Agencies run many concurrent Projects per Client (site rebuild, monthly SEO, citation sprint).
- Flags/tags avoid dual-write and “which task system?” confusion.

## Consequences

- Task fields: workspace scope, links, flags (e.g. `crm_nurture` / `delivery`), tags, optional `projectId`.
- UI: CRM task boards vs Client PM boards are **queries**, not separate services.
- Protocol/API: Task + Project resources; promote-to-project is an explicit operation.
- Domain/Company may relate to multiple Projects; identity resolution is data model, not a 1:1 constraint.
