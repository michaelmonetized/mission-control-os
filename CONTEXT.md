# Mission Control

Multi-tenant operating system for digital marketing and local SEO agencies (**Mission Control**): delivery tooling, acquisition tracking, CRM, and client-facing reporting in one product. Repo codename may remain `agency-os`.

## Language

**Mission Control**:
The product—the multi-surface Control Plane, Local Agent, and Audit tooling for agencies. User-facing name.
_Avoid_: Agency OS (repo codename only), BreezyApp (different product)

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
The authenticated Mission Control Surface for Client Users—progress graphs, shared audit outcomes, and related read-mostly views. Part of MVP (ADR-0025).
_Avoid_: Marketing site, Public Relations repo

**Portal Invite**:
An email-linked invitation for a specific address to become a Client User on a Client. One access path (ADR-0027).
_Avoid_: Magic link only (implementation detail)

**Portal Allowlist**:
Emails permitted to claim Client Portal access for a Client on sign-in without a one-off invite send. Second access path (ADR-0027).
_Avoid_: Domain ACL (unless explicitly productized later)

**Location**:
A physical place or market unit under a Client (storefront, service area hub, franchise unit). The primary unit for local SEO work, citations, and many site/analytics bindings.
_Avoid_: Site (a Location may have multiple Sites), branch (retail-specific), listing

**User**:
A person who signs in. Belongs to an Agency; may be scoped to specific Clients and/or Locations.
_Avoid_: Member, seat, agent (ambiguous with SEO/automation agents)

**Site**:
A web property (domain or origin) associated with a Location (or occasionally Client-wide). The unit of crawl, accessibility, and technical SEO audit.
_Avoid_: Page, property (GA jargon only), URL

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
