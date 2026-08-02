# Mission Control

Multi-tenant operating system for digital marketing and local SEO agencies (**Mission Control**): technical audit, CRM, task queue, email, social calendar, connectivity, Client Portal, and multi-surface ops in one product (first ship is full breadth—ADR-0031). Repo codename may remain `mission-control-os`.

## Language

**Mission Control**:
The product—the multi-surface Control Plane, Local Agent, and Audit tooling for agencies. User-facing name.
_Avoid_: Agency OS (repo codename only), BreezyApp (different product)

### Brand & design (DSD)

**Sparse cockpit**:
Visual density principle—ops power with air and progressive disclosure, not widget walls (DSD-0001).
_Avoid_: Dense dashboard, GHL clutter as aesthetic

**Glass**:
Translucent, blurred panel material over Catppuccin Mocha bases (DSD-0002).
_Avoid_: Flat opaque cards as default

**Neon border**:
Accent-colored glow edge for focus, selection, and live/important states (DSD-0002).
_Avoid_: Constant full-UI rainbow glow

**Skeuomorph control**:
Selective tactile/realistic control styling (Icon Factory energy) on buttons and hardware-like affordances (DSD-0002).
_Avoid_: Full retro skeuomorphic chrome, pure flat-only

**Agency Onboarding**:
The guided, skippable setup spine for a new Agency. **Self Client** is auto-created (the Agency is its own first Client); then team, Email Domain, Location/Site, channels, first Project, optional crawl—ADR-0040.
_Avoid_: Sign-up only, checklist (UI only)

**Self Client**:
The Client record representing the Agency’s own business, created at Agency signup. Dogfood workspace for Client CRM, PM, social, email, and audit before/while serving external Clients.
_Avoid_: Demo client (implies disposable fake), sandbox (implies non-production data only)

**Client Onboarding**:
Guided first-run for external **Client Users** (profile, optional connections, Approval Calendar, Client CRM import; optional Client Email Domain)—ADR-0041. Distinct from Agency Onboarding / Self Client.
_Avoid_: Portal invite only (access ≠ onboarding)

**Public Relations repo**:
The separate repository for marketing, launch, press, and public-facing content about Mission Control—not application runtime code.
_Avoid_: Docs-only product repo (ADRs live with design/meta), Control Plane

**Protocol repo**:
The repository that publishes versioned shared contracts (API schemas, Agent wire format, DTOs) for all Mission Control Surfaces and the Agent. Not a Surface.
_Avoid_: SDK (may be generated from protocol), Control Plane repo

### Tenancy

**Agency**:
The paying customer of this SaaS—a marketing/SEO firm that serves multiple businesses. The top multi-tenant boundary. Implemented as a **Clerk Organization** (ADR-0015).
_Avoid_: Tenant (implementation), account (ambiguous), shop, Clerk user (that's User)

**Client**:
A business organization the Agency serves under contract. Owns one or more Locations. Not the SaaS buyer.
_Avoid_: Customer (ambiguous with Agency as buyer), account, company (too vague)

**Client User**:
A human who signs into the **Client Portal** with access limited to granted Client(s)/Locations via **Convex ACL**, not via membership in the Agency’s Clerk Organization (ADR-0026). Not Agency staff.
_Avoid_: Customer login, guest (Clerk guest ≠ portal role), org member (Agency staff)

**Client Portal**:
The authenticated Mission Control experience for Client Users: includes **Client CRM** (full conversation-centric CRM for their Client), shared audit graphs/findings, and related modules. Not a marketing site.
_Avoid_: Read-only portal only (superseded ceiling), Public Relations repo

**Portal Invite**:
An email-linked invitation for a specific address to become a Client User on a Client. One access path (ADR-0027).
_Avoid_: Magic link only (implementation detail)

**Portal Allowlist**:
Emails permitted to claim Client Portal access for a Client on sign-in without a one-off invite send. Second access path (ADR-0027).
_Avoid_: Domain ACL (unless explicitly productized later)

**Shared Finding**:
An Audit Finding or Open Issue Agency staff have marked visible in the Client Portal. Default is not shared.
_Avoid_: Public finding, published report (broader deliverable)

**Location**:
A physical place or market unit under a Client (storefront, service area hub, franchise unit). The primary unit for local SEO work, citations, and many site/analytics bindings.
_Avoid_: Site (a Location may have multiple Sites), branch (retail-specific), listing

**User**:
A person who signs in. Agency staff belong to an Agency (Clerk Org) with role **Admin** or **Member** (ADR-0045). Client Users have Admin or Member **within a Client grant**, not Agency org membership.
_Avoid_: Seat, agent (ambiguous with SEO/automation agents / Local Agent)

**Admin**:
Role with full control in its scope (Agency or Client CRM Workspace)—settings, Automations, domains, connections, invites.
_Avoid_: Owner (unless productized later)

**Member**:
Role for day-to-day work in its scope without high-risk settings (Automations edit, domain DNS, org destruction, etc.).
_Avoid_: User (broader), guest

**Site**:
A web property (domain or origin) associated with a Location (or occasionally Client-wide). The unit of crawl, accessibility, and technical SEO audit.
_Avoid_: Page, property (GA jargon only), URL

### Agency ops modules

**Task**:
A single unit of work in Mission Control—assignable, statused, flaggable/taggable. One system for CRM nurturing (sales/support) and Client delivery PM; **flags, tags, and links** route visibility between CRM views and Client PM views (ADR-0035).
_Avoid_: Ticket (unless support-type flag), Issue (audit finding), separate CRM-task DB

**Project**:
A delivery container under a **Client** holding many Tasks (PM tool). A company or domain may have many Projects over time. Not a CRM Opportunity.
_Avoid_: Campaign (marketing effort), Crawl Run, Opportunity (sales deal)

**CRM Workspace**:
A scoped instance of the **CRM primitive**: either **Agency CRM** (agency sales, onboarding, service-provider relationships) or **Client CRM** (that Client’s own book of business). Same tool, API, and capabilities; different data partition and operators (ADR-0032, ADR-0034).
_Avoid_: Sub-account (GHL jargon), portal (UI shell only)

**CRM API**:
The public, versioned HTTP API for the CRM primitive—migration and bidirectional sync with external CRMs, plus headless automation (ADR-0034). Path style matches Mission Control **API routes** (ADR-0042).
_Avoid_: Internal Convex mutations only, Zapier-only access

**API route**:
An HTTP endpoint under `/api/<module>/…` (Vercel-style; **no version in path**—ADR-0042). Prefer single-word segments (`/api/crawl/run`, `/api/clients/list`); multi-word kebabs only when needed. Resource ids and filters live in the **JSON body**, not the URL.
_Avoid_: GraphQL operation, `/api/v1/…`, `/{clientId}` in path for normal CRUD

**Contact**:
A person in a CRM Workspace (lead, customer, vendor, etc.). May link to a Mission Control User if they have login.
_Avoid_: User (authenticated account), lead (stage/type, not the person record)

**Company**:
An organization record in a CRM Workspace (prospect or customer business). Distinct from tenancy **Client** when still a prospect in Agency CRM; a won account often **links to** or **becomes** a delivery Client.
_Avoid_: Client (tenancy/delivery account—use link when same real-world business)

**Opportunity**:
A pipeline deal/opportunity in a CRM Workspace (value, stage, close date). Conversation- and Contact-linked.
_Avoid_: Ticket, Task, Campaign

**Conversation**:
A first-class multi-channel thread (email, SMS, social, form, chat, call notes, etc.) with messages over time—the center of CRM UX. Linked to Contacts, Companies, Opportunities, and workspace.
_Avoid_: Thread (implementation), inbox (UI), email (one channel)

**Message**:
One item in a Conversation (inbound/outbound body, channel, timestamps, status). Channels in first ship: email, SMS, social DM, web form, live chat (ADR-0033).
_Avoid_: Email (channel-specific), notification

**Chat Widget**:
Embeddable live chat for a Site/Location that creates Conversations in the appropriate CRM Workspace (usually Client CRM).
_Avoid_: Intercom (vendor), popup

**Automation**:
A user-built **trigger → action** workflow inside a **CRM Workspace** (Mailchimp/GHL-class builder). CRM users author email/SMS **Templates** and chain them on triggers (ingest, status changed, pipeline stage changed, sale completed, deal lost, etc.)—ADR-0043.
_Avoid_: Agent (crawl daemon), Zap (vendor), system rule (fixed product behavior like social reschedule)

**Template**:
Reusable email or SMS content (and metadata) in a CRM Workspace, used by Automations and manual sends.
_Avoid_: Social Post (calendar), Layout (UI)

**Automation Run**:
One execution of an Automation for a trigger event. Attempts **inline** first; on first failure, continues via **Trigger.dev** retries (ADR-0046).
_Avoid_: Job (vague), Zap run

**Pipeline**:
A named board of stages for Opportunities (or other card types) inside a CRM Workspace.
_Avoid_: Funnel (analytics only), board (UI only)

**Campaign**:
A coordinated marketing or SEO work effort over time, often tied to a Client/Location—may group Tasks, content, and social posts.
_Avoid_: Crawl Run, Ad set (paid-only)

**Connected Account**:
An external integration identity (Google, Meta, email mailbox, analytics, etc.) linked for Connectivity. May be **Agency-owned or Client-owned** (ADR-0039).
_Avoid_: Integration (the product capability), OAuth app (platform)

**Publish Failure**:
A failed attempt to publish a Social Post (channel/API/auth error). Triggers Agency + Client notification and narrative-preserving auto-reschedule (ADR-0038).
_Avoid_: Soft fail (silent)

**Social Post**:
A piece of content on the social calendar (copy, media, link, channel, schedule). **Approved by default**; Client Users may disapprove (with notes) or edit. Publishes unless disapproved (ADR-0037).
_Avoid_: Buffer (vendor), update (vague)

**Approval Calendar**:
Client-facing (and agency) view of Social Posts in the configurable **N-week look-ahead** window for review, edit, or disapprove—not a “must approve to post” queue.
_Avoid_: Approval gate (explicit approve-required model—rejected)

**Look-ahead Window**:
Agency-configured number of weeks of scheduled Social Posts shown for client review before publish time.
_Avoid_: Queue depth (implementation)

**Email Domain**:
A sending domain verified for an Agency or Client ESP workspace via DNS records issued through Resend-backed provisioning. Required to enable full email features for that workspace.
_Avoid_: Connected Account alone (OAuth mailbox ≠ authenticated sending domain)

**ESP Workspace**:
Email sending context for Agency or Client (domains, campaigns, transactional templates) backed by Resend—not the Mission Control product’s own system mail only.
_Avoid_: Mailbox (receive/sync), Resend account (vendor implementation)

### Technical audit

**Crawl**:
A job that discovers and fetches URLs on a Site and extracts technical signals (status, links, canonicals, indexability, etc.).
_Avoid_: Scan (ambiguous with security), spider (informal)

**Crawl Run**:
One execution of a Crawl against a Site at a point in time, with config snapshot and results.
_Avoid_: Job (implementation), session

**Audit Finding**:
A discrete issue or observation from a **specific Crawl Run** (per-run history). Severity, type, and **status** attributes as needed. Streamed to Convex live. Status workflow is simple fields (ADR-0023), not a workflow engine.
_Avoid_: Issue (overloaded with bug trackers), error, alert, ticket (unless integrated later)

**Open Issue**:
A rollup identity for a recurring problem on a Site (fingerprint: type + URL/key fields) used for “still open” work across runs. Does not replace per-run Audit Finding history.
_Avoid_: Finding (per-run), ticket

**Metrics Snapshot**:
Point-in-time aggregate counts from a completed (or finalized) Crawl Run—e.g. broken link total, missing-alt total—stored durably with the run’s timestamp for overtime graphs.
_Avoid_: Artifact, live counter only (must be persisted per run)

**Duplicate Cluster**:
A set of pages on a Site judged to share substantially similar content for SEO purposes.
_Avoid_: Duplicate group, copy set

**Accessibility Check**:
An evaluation of page accessibility signals (e.g. WCAG-oriented rules) for URLs in a Crawl Run or sample—not a legal compliance certification.
_Avoid_: WAVE (vendor), a11y audit (unless meaning a packaged report)

### Execution

**Agent**:
A long-running **user-level OS service/daemon** installed by an Agency operator that executes Crawls on Sites (LaunchAgent / systemd user unit / per-user Windows service). Connects to the SaaS Control Plane, pulls job instructions, fetches pages from its own network, and streams results. Surfaces talk to it via local IPC and/or the Control Plane—not as a child of Desktop. Not a human User.
_Avoid_: Worker (implementation), bot (ambiguous with search bots), crawler app (vague), sidecar (rejected model), system/root service (not default)

**Agent Token**:
A long-lived refresh credential issued by the Control Plane via Desktop (after Clerk sign-in), stored in the OS user secret store, used by the Agent daemon to obtain short-lived access to an Agency. Not the human’s browser session cookie.
_Avoid_: API key (too generic), Clerk session (human SPA session)

**Control Plane**:
The multi-tenant cloud SaaS that owns tenancy, auth, Crawl Run orchestration, stored results, and real-time sync. It does not fetch target Site HTML in v1. Always remote—not a self-hosted local server product. Web/API on **TanStack Start + Clerk + Convex** (ADR-0010); Surfaces attach as native/TUI/web clients.
_Avoid_: Backend (vague), server, on-prem OS, Lakebed capsule (superseded)

**Surface**:
A first-class human interface to the Control Plane: Web, Desktop, TUI, or Mobile. Surfaces share live state over the sync fabric; none is a second-class “viewer only” forever, though only Desktop hosts the full Agent install path in v1.
_Avoid_: Client (means Client org), app (vague), frontend

**Sync Fabric**:
The real-time connection layer (WebSocket or equivalent) that keeps Surfaces and Agents aligned: jobs, progress, findings, presence, and commands. Bidirectional up and down the toolchain.
_Avoid_: Websocket (transport-only name), realtime API (vague)

**Desktop**:
Cross-platform **Electron + Effect** operator Surface (ADR-0011). Provides full Audit Loop UI and can run installers/repair for the Agent **daemon** (ADR-0012); does not keep the Agent alive as a child process. Talks to a local daemon via IPC when present.
_Avoid_: Local server, Swift desktop (superseded), Agent host process

**TUI**:
The terminal Surface for operators who live in the shell—same Control Plane and Sync Fabric as Web/Desktop/Mobile, not a separate offline tool.
_Avoid_: CLI-only scripts (one-shot), SSH admin console

**Mobile**:
The phone/tablet Surface for on-the-go monitor, triage, and light actions over the Sync Fabric. Does not host the Local Agent.
_Avoid_: Responsive web only (Mobile is a first-class Surface, even if implementation shares code)

**Audit Loop**:
The core operator journey: choose Location/Site → start Crawl Run → watch progress → review Audit Findings → open page detail. MVP requires this loop on every Surface.
_Avoid_: Scan workflow, crawl session (use Crawl Run)

**Issue Cluster**:
A grouped set of related Audit Findings (by type, template, or root cause) used for prioritised “fix next” workflows—not a single page row.
_Avoid_: Category (UI only), bucket

**Page Inventory**:
The set of URLs discovered and/or fetched in a Crawl Run, with technical attributes (status, indexability, links, content signals). The spider’s tabular truth. Stored as **results** in Convex (streamed from the Agent); not the raw HTML.
_Avoid_: Sitemap (XML artifact), URL list

**Artifact**:
Raw crawl material held **ephemerally** on the Agent machine during a Crawl Run (e.g. HTML bodies, intermediate extracts). Not uploaded to Convex; **cleaned after the run** once results are streamed (ADR-0020).
_Avoid_: Result (Convex-facing outcomes), asset (UI static files), archive (not retained)

**Ignore Robots**:
An explicit, audited Crawl Run/Site setting that allows the Agent to disregard robots.txt/meta robots restrictions. Default is off (robots respected).
_Avoid_: Stealth mode, unblock (vague)

**Rendered Crawl**:
A Crawl Run mode that executes page JavaScript (headless browser) before extracting signals. **Default** mode for Mission Control crawls.
_Avoid_: Browser crawl (vague), SPA mode

**HTTP-only Crawl**:
A Crawl Run mode that fetches response bodies without executing JavaScript. Opt-in for speed or special cases; not the default.
_Avoid_: Quick scan (marketing-only name unless productized)
