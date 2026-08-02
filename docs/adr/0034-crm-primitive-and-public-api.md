# CRM is a first-class primitive with a complete public API

## Primitive tool

**CRM** is its own product primitive inside Mission Control—not a thin feature bolted onto audit:

- **Agency CRM** — Agency uses the tool for **sales, onboarding, and service-provider relationships** (and related pipelines/conversations).
- **Client CRM** — Each Client gets the **same tool** to manage **their** sales/customer relationships (ADR-0032 dual workspace).

Same capabilities, schemas, Automations, Conversations, and Surfaces patterns; different **CRM Workspace** partition and operators.

## Complete CRM API

Mission Control ships a **complete, versioned public CRM API** (via protocol repo / public API surface) intended for:

- **Migration** from common CRMs (import)
- **Bidirectional integration** with common CRMs (sync both ways where the external system allows)
- Headless use by agencies’ own software

Target class of systems (non-exhaustive): HubSpot, Salesforce, GoHighLevel, Pipedrive, Zoho, and similar contact/company/deal/conversation-capable CRMs. Exact connector matrix is product roadmap; **API completeness for Mission Control CRM objects** is the architectural commitment.

## Why

- CRM must be integrable and portable or agencies will not trust it as system of record.
- Dual-workspace model needs a clean external contract (workspace-scoped API keys / OAuth).

## Consequences

- CRM domain owns OpenAPI (or equivalent) in the protocol/public API: Contacts, Companies, Opportunities, Conversations, Messages, Pipelines, Automations metadata, Tasks links, custom fields as designed.
- Authz: Agency API credentials vs Client-workspace credentials; Client Users never receive Agency CRM API scope.
- Import/export jobs and webhook subscriptions are first-class for sync.
- Bidirectional sync conflict policy (Mission Control wins / remote wins / timestamp) must be defined per connector—default documented later.
