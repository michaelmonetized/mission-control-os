# Research: Crawl execution options (Q4)

Snapshot for design grilling. Not an ADR.

## Your existing tooling

### `mdurl` / [url-to-md](https://github.com/michaelmonetized/url-to-md)

- **What it is:** Single-URL fetch → CSS-select main content → clean markdown CLI (`mdurl`).
- **What it is not:** A multi-page site crawler (no queue, link graph, status codes catalog, or SF-style export).
- **Fit for Agency OS:** Leaf **content extraction** step after discovery (duplicate/thin-content, AI briefs)—not the Crawl engine itself.
- **Also noted:** Prior PHP/curl + JS crawlers (not in this machine’s `~/Projects`); treat as experience, not a drop-in product module unless code is recovered.

---

## Cloudflare Browser Run (ex–Browser Rendering)

Docs: [Browser Run](https://developers.cloudflare.com/browser-run/), [pricing](https://developers.cloudflare.com/browser-run/pricing/), [/crawl](https://developers.cloudflare.com/browser-run/quick-actions/crawl-endpoint/).

| | Workers Free | Workers Paid |
|--|--------------|--------------|
| Browser hours | **10 min/day** | **10 hrs/month**, then **$0.09/hr** |
| Concurrent browsers (sessions) | 3 | 10 avg/month, then **$2/browser** |

**Relevant Quick Actions for audit MVP:**

- **`/crawl`** — async site crawl: depth, limit (default 10, max **100k**), source = sitemaps | links | all, formats HTML/Markdown/JSON, include/exclude patterns, subdomains, `render: true|false`.
- **`render: false`** — fast HTML without JS (Workers path; beta: not billed as browser hours). Ideal default for most local-business CMS sites.
- **`render: true`** — headless JS execution (browser-hours billed).
- **`/accessibilityTree`** — a11y tree capture (WebAIM-adjacent signal).
- **`/markdown`**, **`/links`**, **`/content`**, **`/screenshot`** — single-page helpers.

**Behavior constraints (product-relevant):**

- Respects **robots.txt** + crawl-delay; default delay 0.5s if unspecified.
- **Content Signals** (`search` / `ai-input` / `ai-train`) can **reject** the whole job unless `crawlPurposes` is narrowed.
- `/crawl` User-Agent is fixed: `CloudflareBrowserRenderingCrawler/1.0` (not customizable).
- Does **not** bypass CAPTCHA / Bot Management / Turnstile.
- Free plan: crawl-specific limits; easy to hit **cancelled_due_to_limits** on real Sites.
- Jobs can run up to 7 days; results retained 14 days (their storage—not yours).

**Verdict:** Strong **managed fetch + crawl backend** for a multi-tenant SaaS if *we* own Crawl Run state, findings, billing, and tenancy. Free tier is prototype-only; Paid is cheap vs Browserbase for bulk `render: false`.

---

## Firecrawl

- Cloud: credit model (~**1 credit/page** for scrape/crawl/map; free tier ~1k credits/mo; paid plans scale).
- **Self-host:** open-source core, **AGPL-3.0** (SaaS redistribution/compliance careful).
- Stack: Node + Playwright + Redis; heavier than “just HTTP.”
- Product shape: **content/context API** (markdown, extract, map)—great for RAG/agents, weaker as SF-class technical SEO graph (status codes, indexability, inlinks, response headers, etc. are not the center of gravity).

**Verdict:** Optional later for content pipelines; **not** the primary technical-audit crawler unless we accept AGPL + re-implement SEO signals ourselves on top.

---

## Browserbase

- Remote **browser sessions** for Playwright/Puppeteer (you write the crawler).
- Free: ~3 concurrent, ~1 browser hour.
- Developer ~$20: 25 concurrent, 100 browser hrs, then ~$0.12/hr; Startup ~$99 / 100 concurrent / 500 hrs.

**Verdict:** Escalation path for **hard JS / interaction** crawls when CF isn’t enough—not the default bulk path (cost and concurrency).

---

## Desktop / agent crawler (original option D)

- SF-like power, local rate limits, no cloud browser bill.
- **Conflicts with ADR-0001** (multi-tenant SaaS): hard to orchestrate per Agency, bill fairly, guarantee isolation, or run scheduled Crawl Runs without agency machines online.
- Fine as a **power-user sidecar** years later; bad as the primary execution model.

---

## Comparison for Agency OS (technical audit MVP)

| Approach | Multi-tenant fit | SEO signal depth | JS sites | Cost at scale | Build load |
|----------|------------------|------------------|----------|---------------|------------|
| Own HTTP workers | Excellent | Full (you define) | Weak | Low | High |
| CF `/crawl` + own product layer | Excellent | Good if we parse HTML/headers ourselves from results | Optional `render:true` | Very low–medium | Medium |
| Own HTTP + CF/Browserbase headless | Excellent | Full | Strong | Medium | High |
| Firecrawl primary | Good | Content-first | Strong | Credit-metered | Low–medium |
| Browserbase primary | Good | Full if we build crawler | Strong | High | High |
| Desktop agent primary | Poor for SaaS | Full | Full | Free infra | Support hell |

---

## Implications (not decisions)

1. Split **Crawl orchestration** (our domain: Site, Crawl Run, Audit Finding, quotas) from **Fetch executor** (pluggable: CF, own HTTP, Browserbase).
2. Default executor should favor **cheap bulk HTML**; headless only when Site flags need JS.
3. **`mdurl` logic** belongs in **content analysis** (duplicate clusters), not discovery.
4. Firecrawl/Browserbase = later plugs, not architecture identity.
