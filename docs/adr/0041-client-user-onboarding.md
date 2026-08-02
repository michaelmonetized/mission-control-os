# External Client User onboarding is guided (B) with Email Domain branch (D)

When an **external** Client User accepts a Portal Invite or claims via Allowlist (ADR-0027)—not Agency staff on Self Client—the first-run experience is a **guided Client onboarding**:

1. Profile / business basics (as needed)  
2. Optional **Connected Accounts** (Client-owned OAuth—ADR-0039)  
3. **Approval Calendar** tour (default-approved social—ADR-0037)  
4. **Client CRM** orientation + contact import path  
5. Shared audit graphs / Shared Findings as relevant  

## Email Domain branch (D)

When Client brand sending is enabled for that Client, onboarding includes (or offers) **Client Email Domain** setup via the same Resend-backed ESP primitive (ADR-0036)—DNS records, often completed with Agency help/delegate DNS access.

## Distinct from Self Client

Agency operators on **Self Client** follow Agency Onboarding (ADR-0040), not this Client User wizard.

## Why

External clients need orientation without agency-only configuration; brand email is a common upsell path and belongs in the same guided spine when applicable.
