# Non-CRM automation is first-class product behavior

Configurable **CRM Automations** (ADR-0043) are the Mailchimp-style builder for CRM Workspace workflows.

Anything **outside** that builder that still benefits from automation is implemented as **first-class product behavior**: either the **default mode** or an explicit **option**, not “build a CRM automation or go without.”

## Examples (non-exhaustive)

| Area | First-class automation (default or option) |
|------|-----------------------------------------------|
| Social | Default-approved posts; N-week look-ahead; publish failure notify + narrative reschedule (ADR-0037/0038); full auto calendar option |
| Audit / Agent | Scheduled Crawl Runs; live result stream; artifact cleanup after run; optional auto-Task from high-severity findings as product option |
| Email / ESP | Domain verify polling; bounce/complaint handling hooks; system mail for invites |
| Tasks / Projects | Template packs on Project create; promote CRM Task → Project routing helpers |
| Connectivity | OAuth expiry notifications; reconnect prompts |
| Onboarding | Guided spines and checklist progression (ADR-0040/0041) |

## Rule of thumb

- **User-authored journeys** over Contacts/Pipelines/Messages → CRM Automation builder  
- **Platform reliability, scheduling, and OS defaults** → first-class features with sensible defaults and toggles  

## Why

User clarified: full-fat CRM builder *and* non-CRM automation built into the product as default/option where it makes sense—not forced through the CRM workflow UI.
