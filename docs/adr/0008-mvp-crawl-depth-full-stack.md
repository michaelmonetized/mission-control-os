# MVP crawl depth: SF core + Sitebulb-class insight + agency ops

v1 crawl/audit payload is the union of:

1. **Screaming Frog–class core** — status codes, redirects, title/meta, canonical, hreflang, indexability, in/out links, timings, content metrics, image alt issues, duplicate titles/content, optional JS render via Local Agent  
2. **Sitebulb-class insight** — issue clustering, prioritised “fix next,” site structure visualisation, historical Crawl Run comparison  
3. **Agency-native ops** — multi-tenant Agency → Client → Location → Site tree, Audit Finding workflow/assignment, scheduled runs when an Agent is online, client-usable export paths (export first; full portal may trail)

**Why:** Explicit product bar is to **mog Screaming Frog and Sitebulb at MVP**, not match one and defer the other. Multi-surface Control Plane without this depth would be empty chrome.

**Considered:** SF core only (A); A+Sitebulb UX (B); agency workflow over shallow spider (C). Rejected partial bars as insufficient for the stated ambition.

**Consequences:**
- Highest schedule and scope risk in the ADR set; requires ruthless sequencing *inside* D (engine → findings model → viz → scheduling), not cutting the bar.
- Local Agent (ADR-0004) must carry real spider weight; Sync Fabric must stream high-volume crawl events without melting Mobile/TUI.
- “Done” means credible bake-off against SF/Sitebulb *and* multi-User agency workflow—not a demo crawl of 50 URLs.
