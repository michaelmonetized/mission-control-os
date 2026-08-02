# Open questions (post grill wrap)

Design grilling paused with shared understanding of the decisions in `docs/adr/` and `CONTEXT.md`. Resolve these before or during implementation as they arise.

## Product / domain

1. **Service-provider relationships** — How vendors/contractors appear in Agency CRM vs Users vs Companies.
2. **Opportunity ↔ Client conversion** — Exact rules when a won deal creates/links a delivery Client (beyond Self Client).
3. **Custom fields** — First-class in CRM API or later.
4. **Audit Finding → Task** — Product option defaults (on/off, which severities).
5. **Client-triggered crawls** — Explicitly out by default; ever allowed?
6. **Windows/macOS/Linux Agent install UX** — MSI/pkg/AppImage details, auto-update channel.
7. **Social networks matrix** — Which platforms in first ship for publish + DM.
8. **SMS provider** — Twilio vs alternatives; 10DLC / compliance ownership.
9. **Inbound email → Conversation** — Path if Resend receive is insufficient (MX, forwarding, Google/Microsoft sync).
10. **Metrics Snapshot catalog** — Exact counters charted by default (beyond broken links / missing alt).
11. **Finding fingerprint algorithm** — Canonical fields for Open Issue identity.
12. **Vertical templates** — Optional D from onboarding; when.

## Engineering

13. **Repo names** — Exact GitHub names for web, desktop, agent, tui, ios, android, protocol, pr.
14. **Protocol package publish** — npm + crates registry vs git tags only.
15. **Convex vs object storage later** — If excerpts/screenshots ever leave the Agent machine.
16. **Automation delay steps** — Convex scheduler vs Trigger.dev for multi-day waits (ADR-0046 implies scheduler; pick primary).
17. **Idempotency key format** — For email/SMS automation sends.
18. **Agent IPC protocol** — Socket vs local HTTP vs named pipe; auth to daemon.
19. **Browser runtime for Rendered Crawl** — Bundled Chromium/Playwright versioning and updates with user-level service.
20. **Rate limits / concurrency defaults** — Numeric caps for crawl and ESP send.
21. **Clerk + Client User** — Invite implementation (Clerk invitations vs app tokens + Resend).
22. **Billing** — When and how (per seat, per Client, usage); out of grill scope so far.
23. **Trademark / Mission Control** — Apple name collision mitigation for marketing.

## Explicitly deferred product modules

- Citations / link-building acquisition trackers (original wishlist; not ADRd into first ship detail)
- Full PostHog/GA portal caching (mentioned early; portal is graphs + shared findings + Client CRM)
- Machine-level Agent service (user-level only for now)
- Fine-grained RBAC beyond Admin/Member
- Lakebed (superseded)

Update this file as questions close; prefer new ADRs over silent decisions.
