# Email is a full ESP primitive on Resend

Mission Control **email** is a first-class **ESP-class** capability (broadcasts, transactional, domains, deliverability surfaces)—not mailbox-sync alone. **Resend** is the sending/backend provider.

## Provisioning and domains

- **Agency onboarding** provisions email capability using **Resend** (CLI and/or API—operator tooling may wrap `resend` CLI): create the Agency’s Resend-side resources, then surface **DNS records** the Agency must add to enable sending.
- The **same primitive** applies **per Client** (and/or Client-branded sending domains): agencies commonly **manage or hold delegate access** to Client DNS, so Mission Control guides domain verification for Client sending domains as a normal agency workflow.
- Until domain verification succeeds, email features for that workspace remain limited/disabled with clear setup UI.

## Product scope (first ship intent)

- Domain authentication (SPF/DKIM/etc. as Resend requires)
- Sending from verified domains for CRM Conversations, sequences, and marketing-style campaigns as the ESP surface expands
- Agency-level and Client-level sending identity separation (whose domain, whose brand)

System mail for Mission Control product (Portal Invites, passwordless, etc.) may also use Resend but is distinct from **Agency/Client ESP workspaces**.

## Why

- User chose full ESP (D) with Resend as backend and dual Agency/Client domain onboarding reflecting real local-SEO agency DNS practice.

## Consequences

- Connectivity includes **Email Domain** setup jobs and verification polling.
- Compliance and reputation: per-domain isolation; abuse controls; Agency responsible for Client domain use.
- Depends on Resend multi-domain / multi-project capabilities; wrap CLI/API in Mission Control Control Plane rather than requiring agencies to use Resend UI day-to-day.
- Mailbox **receive** path (Conversation inbound) may still need inbound provider/MX or Resend inbound as available—pair with channel ADR-0033; exact inbound stack is a follow-up if not fully covered by Resend alone.
