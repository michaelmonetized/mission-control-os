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
A discrete issue or observation produced by a Crawl Run or related checker (e.g. broken link, missing alt, duplicate cluster). Severity and type are attributes of the finding.
_Avoid_: Issue (overloaded with bug trackers), error, alert

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
Raw crawl material retained on the Agent machine (e.g. HTML bodies, intermediate extracts). Not uploaded to Convex by default; may be pruned by local retention policy.
_Avoid_: Result (Convex-facing outcomes), asset (UI static files)
