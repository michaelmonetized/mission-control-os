# Agency OS

Multi-tenant operating system for digital marketing and local SEO agencies: delivery tooling, acquisition tracking, CRM, and client-facing reporting in one product.

## Language

### Tenancy

**Agency**:
The paying customer of this SaaS—a marketing/SEO firm that serves multiple businesses. The top multi-tenant boundary.
_Avoid_: Tenant (implementation), account (ambiguous), shop

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
A long-running process installed by an Agency that executes Crawls on Sites. It connects to the SaaS control plane, pulls job instructions, fetches pages from its own network, and streams results. Not a human User.
_Avoid_: Worker (implementation), bot (ambiguous with search bots), crawler app (vague)

**Control Plane**:
The multi-tenant SaaS (web/API/mobile) that owns tenancy, auth, Crawl Run orchestration, stored results, and client-facing surfaces. It does not fetch target Site HTML in v1.
_Avoid_: Backend (vague), server
