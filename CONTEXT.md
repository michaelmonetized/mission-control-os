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
