# Local Agent is the only crawl executor (D1)

Crawl execution runs exclusively on a **Local Agent** process controlled by the Agency (desktop/server install). The SaaS web and mobile apps are the control plane and result store; they open a long-lived connection (WebSocket or equivalent) to the Agent to start Crawl Runs, stream progress, and ingest page records and Audit Findings. There is **no** first-party cloud fetch fleet and **no** zero-install cloud crawl path in v1.

**Why:** Technical audit quality comparable to desktop spiders (full headers, optional JS render, auth/staging hosts, agency egress) is the product differentiator. Cloud HTML-only spiders (Siteliner-class) are correctly seen as weak for serious technical SEO; shipping that as the core executor would recreate that ceiling. Multi-tenant SaaS (ADR-0001) still holds for tenancy, billing UI, storage, and orchestration—not for remote page fetch.

**Considered:** cloud HTTP/CF crawl only (B); hybrid cloud + agent (D2/C); Firecrawl/Browserbase primary. Rejected for v1 so the product identity is “agent-powered audit OS,” not “another limited online scanner.”

**Consequences:**
- Install Agent is a hard onboarding step; scheduled Crawl Runs require an online Agent.
- Mobile/web are control and reporting clients, not fetchers.
- Trials and demos need a fixture Agent or preloaded Crawl Run data.
- Agent auth, job leasing, reconnect, and multi-User contention on one Agent are core engineering, not polish.
