# Robots respected by default; optional logged override

Crawl Runs **respect robots.txt and meta robots** (and related directives the spider implements) by default.

An authorized User may set a **per-Site (or per-run) “ignore robots” override**. When enabled, the override is **audited** (who, when, which Site/Crawl Run) in Control Plane logs/results metadata—not a silent global flag.

Modest concurrency and crawl-delay remain implementation defaults; this ADR fixes policy, not exact thread counts.

## Why

- Good default citizenship and fewer abuse/legal foot-guns for a multi-tenant agency product.
- Agencies often need full inventory on sites they own or are contracted to audit when robots block the spider—override must exist but be accountable.

## Considered

- Always respect, no override (A/D pure) — too weak for real agency audits.
- Ignore robots by default (C) — rejected.

## Consequences

- UI must make override obvious and scary (confirm).
- Export/reports should note if a run used ignore-robots.
- Agent enforces the same policy as Control Plane config (protocol field on Crawl Run).
