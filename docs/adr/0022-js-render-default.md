# JavaScript rendering is the default crawl mode

Crawl Runs use **JS-capable rendering** by default on the Local Agent (headless browser or equivalent), so Page Inventory and Audit Findings reflect post-script DOM/content for modern sites.

A lighter **HTTP-only** mode may exist as an explicit opt-in for speed or fragile targets, but it is not the default.

## Why

- MVP bar is to mog Screaming Frog / Sitebulb (ADR-0008); many local-business and SaaS sites are JS-heavy.
- Defaulting to HTTP-only would under-crawl and recreate “Siteliner-class” weakness.

## Considered

- HTTP default, JS opt-in (A) — faster; weaker default accuracy.
- Smart hybrid (C) — deferred complexity.
- Named Quick vs Rendered modes (D) — compatible later; default remains rendered.

## Consequences

- Agent ships browser runtime (e.g. Chromium) as part of daemon install—size and update surface grow.
- Resource use on operator machines is higher; concurrency defaults must be conservative.
- Artifacts during run may include rendered snapshots; still cleaned after run (ADR-0020).
- Ignore Robots and JS render are independent settings.
