# Agency onboarding is a guided full-OS path

After an Agency (Clerk Organization) is created, onboarding is a **guided, skippable spine** that stands up the full Mission Control OS—not a thin “create org and leave.”

## Default step order

1. **Organization / Agency profile** (already created via Clerk)  
2. **Invite team** (Agency Users)  
3. **Email Domain / ESP** — Resend-backed DNS records (ADR-0036)  
4. **First Client**  
5. **Location** (and Site if known)  
6. **Connect channels** (Connected Accounts—Agency-owned as available)  
7. **First Project** (Client PM)  
8. **Optional first Crawl Run** (when Agent is installed/linked)

Steps are **skippable** but incomplete setup shows persistent setup checklist / scores until critical paths are done (email domain, first Client, etc. as product defines).

## Why

Full first ship (ADR-0031) fails if agencies only complete auth. Guided path forces the dual CRM, email, connectivity, and delivery primitives into existence early.

## Consequences

- Onboarding state stored per Agency; resumable across Surfaces.  
- Vertical templates (option D) remain a later optional accelerator, not required by this ADR.  
- Client onboarding (Client User / Client CRM) is a separate flow (follow-up).
