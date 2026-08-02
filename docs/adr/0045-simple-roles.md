# Simple roles: Admin and Member

Mission Control uses a **minimal role model** for first ship:

## Agency (Clerk Organization)

| Role | Intent |
|------|--------|
| **Admin** | Full Agency control: billing/settings as applicable, Email Domain, Connectivity, Automations, Agent link, all Clients, invite Users |
| **Member** | Day-to-day work: CRM, tasks, social, audit operations as allowed by product defaults—without org-destructive or high-risk settings |

## Client CRM / Client Portal (per Client grant)

| Role | Intent |
|------|--------|
| **Admin** | Full control inside that Client CRM Workspace + portal modules (Automations, templates, Connected Accounts, Email Domain when enabled) |
| **Member** | Use CRM, conversations, approval calendar, shared audit views—without managing automations/domains/destructive settings |

## Defaults (simple)

- Edit CRM Automations / Templates → **Admin**  
- Connect accounts / Email Domain → **Admin**  
- Link Agent / high-risk Agency settings → **Admin**  
- Client Users never access Agency CRM or other Clients  

Fine-grained capability matrices (ADR-style expansions) can come later; v1 is Admin vs Member only.

## Why

User chose simple two-role model (option A) over GHL-ish role sprawl or capability flags for first ship.
