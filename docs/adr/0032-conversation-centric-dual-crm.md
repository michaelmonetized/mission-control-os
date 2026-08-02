# Conversation-centric dual CRM (Agency + per-Client full CRM)

Mission Control CRM is **conversation-centric** (inbox/thread as a primary operator surface), with **full-fat CRM objects** (HubSpot/GHL-class: companies/accounts, contacts, opportunities/deals, pipelines, tasks linkage, tickets/support-style records as needed) plus **automations** and **pipelines**.

Inspiration: GoHighLevel sub-account CRM, conversation-first CRMs (e.g. Visible-class “conversations + pipelines + automations”), HubSpot object breadth—**not** a thin contact list.

## Dual CRM workspaces

| Workspace | Owner | Purpose |
|-----------|--------|---------|
| **Agency CRM** | Agency staff | Agency’s own sales/onboarding pipeline, prospects, cross-Client relationships, agency ops conversations |
| **Client CRM** | Scoped to one **Client** | Full conversation-centric CRM **for that Client’s business**—their leads, customers, conversations, pipelines, automations—as a first-class product surface for Client Users and Agency staff working “as” that Client |

Agency staff can operate inside a Client CRM (agency-of-record). Client Users get **full Client CRM** for their Client (expands ADR-0025 beyond read-only audit portal; audit graphs remain one module inside the Client experience).

## Conversation-centric core

- **Conversation** is a first-class aggregate: multi-channel threads (email, SMS, social DM, form, chat, call log—as channels ship) attached to Contacts and optionally Opportunities/Clients.
- Pipelines and automations react to conversation events (inbound message, no reply, stage change, tag, etc.).
- Task queue links to Conversations, Contacts, Opportunities, Clients, Locations, Audit Findings.

## Why

- User requirement: conversation-centric full CRM × GHL-style sub-account CRM × clients get the same full-fat CRM, not a neutered portal.
- Local SEO agencies sell “we run your marketing OS”; Client CRM is a deliverable, not only internal tooling.

## Consequences

- Data isolation: Client CRM data is partitioned by Client; Agency CRM is Agency-scoped; no cross-Client leakage for Client Users.
- Automations engine is shared infrastructure with workspace scope (Agency vs Client).
- Connectivity (mailboxes, social, phone) attaches at Agency and/or Client workspace.
- Massively expands first-ship scope (ADR-0031); implementation must modularize Conversation, CRM objects, Automations as deep modules.
- Supersedes “Client Portal = read-mostly audit only” as the *ceiling* for Client Users—portal becomes **Client Mission Control** including CRM (audit still present).
