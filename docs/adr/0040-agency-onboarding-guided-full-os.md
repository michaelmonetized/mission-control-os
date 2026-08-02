# Agency onboarding is a guided full-OS path (you are your first Client)

After an Agency (Clerk Organization) is created, onboarding is a **guided, skippable spine** that stands up the full Mission Control OS—not a thin “create org and leave.”

## You are your first Client

On Agency creation, Mission Control **automatically creates a Client that represents the Agency’s own business** (“self Client”). The Agency dogfoods the same Client CRM, Projects, Locations, Sites, social, email domain path, and audit tools they will sell—**you are your first client**.

Subsequent Clients are additional delivery accounts. Agency CRM remains available for sales/service-provider relationships; the self Client is the delivery/ops sandbox and often the first paid-like workspace.

## Default step order

1. **Organization / Agency profile** (Clerk) + **auto-provision self Client**  
2. **Invite team** (Agency Users)  
3. **Email Domain / ESP** — Resend-backed DNS records (ADR-0036)—Agency domain, usable for self Client brand as configured  
4. **Confirm / complete self Client** profile (not “create empty first Client from zero”)  
5. **Location** (and Site if known) under self Client  
6. **Connect channels** (Connected Accounts—Agency-owned as available)  
7. **First Project** under self Client (Client PM)  
8. **Optional first Crawl Run** (when Agent is installed/linked)

Adding **other** Clients is an explicit later step (checklist item), not a blocker for using the product as yourself.

Steps are **skippable** but incomplete setup shows persistent setup checklist until critical paths are done.

## Why

Full first ship (ADR-0031) fails if agencies only complete auth. Self-as-first-Client forces dual CRM + delivery primitives immediately and matches how operators learn the product they resell.

## Consequences

- Onboarding state stored per Agency; resumable across Surfaces.  
- Data model: flag or type on Client e.g. `isSelf` / `kind: agency_self` for special UX (cannot delete casually).  
- Vertical templates (option D) remain optional later.  
- Client User onboarding for external Clients remains a separate flow.
