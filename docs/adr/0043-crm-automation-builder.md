# CRM full-fat Automations: Mailchimp-style trigger → action builder

User-configurable **Automations** ship **full-fat inside the CRM primitive** (both Agency CRM and Client CRM workspaces). This is a **trigger → condition → action** workflow builder (Mailchimp/GHL-class), not Zapier-only and not limited to a handful of hard-coded rules.

## Who builds

Any **CRM User** with permission in that **CRM Workspace** (Agency staff in Agency CRM; Client Users / delegated agency operators in Client CRM) can:

- Author **email and SMS templates** (and reuse them across workflows)
- Build workflows that **chain** templates and other actions from triggers

## Triggers (illustrative, first-class)

Non-exhaustive; protocol grows the catalog:

| Trigger | Example |
|---------|---------|
| **Ingest** | New Contact, form/chat/Message inbound, import row |
| **Status changed** | Contact/Opportunity/Task status field change |
| **Pipeline stage changed** | Opportunity moved on Pipeline |
| **Sale completed** / deal won | Opportunity closed-won |
| **Deal lost** | Opportunity closed-lost |
| Message received / no reply | Conversation events |
| Tag added/removed | Segmentation |
| Custom field changed | Extensibility |

## Actions (illustrative)

- Send email / SMS **from templates** (ESP + SMS Connectivity; workspace Email Domain)
- Create/update Contact, Company, Opportunity
- Move pipeline stage
- Create Task (CRM nurture and/or route to Client PM via flags—ADR-0035)
- Add/remove tags
- Wait / delay steps
- Notify Agency or Client Users
- Webhook / `/api/…` call for extensibility

## Builder UX

Visual or structured **trigger → steps** builder (Mailchimp journey / GHL workflow style). Branching and delays are in scope for “full-fat”; exact node UI is implementation.

## Out of scope for this ADR (unless later)

- Replacing fixed product rules (social publish failure reschedule, artifact cleanup)—those stay system automations
- Full OS-wide automation of crawl Agent as the primary builder target—CRM is the home; audit may emit events CRM can listen to later

## Why

User requirement: full-fat CRM automation with template authoring and trigger chains (ingest, status, pipeline, won/lost, etc.) for any CRM user in the workspace.

## Consequences

- Template library per CRM Workspace (email + SMS)
- Execution engine with retries, logs, and per-workspace send limits (Resend/SMS provider)
- Permissions: who can edit automations vs only use templates
- API routes e.g. `/api/automations/list`, `/api/templates/add` following ADR-0042
