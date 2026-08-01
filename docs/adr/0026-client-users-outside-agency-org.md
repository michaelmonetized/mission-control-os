# Client Users are outside the Agency Clerk Organization

**Client Users** authenticate as normal Clerk Users **without** membership in the Agency’s Clerk Organization. Authorization is **Convex (and app) ACLs**: an invite binds `userId` → `Client` (and allowed Locations) under that Agency.

Agency staff remain Clerk Organization members (ADR-0015). Client Portal sessions never receive Agency org admin roles via Clerk org membership.

## Why

- Hard separation: portal users cannot be accidentally elevated to Agency seats/billing/org settings through Clerk org roles.
- Avoids packing client stakeholders into the same org as freelancers/staff.
- Matches “Client User ≠ Agency staff” in the glossary.

## Considered

- Same org + restricted role (A/C) — simpler invites; higher foot-gun for role mistakes.
- Org per Client (B) — isolation with org explosion.

## Consequences

- Invite flow: Agency creates invite → Client User signs up/in → Convex grant record; no `org_membership` for that Agency.
- Control Plane APIs must enforce Client scope on every portal query (never trust client-supplied Agency alone).
- Clerk Organizations features (org switcher, org-level billing UI) apply to Agency operators only.
- One human could theoretically be Client User for multiple Clients (multiple grants) or also be Agency staff in another org—supported via separate memberships/grants.
