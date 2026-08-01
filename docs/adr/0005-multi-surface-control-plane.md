# Multi-surface Control Plane with Local Agent capability

The product is a **cloud Control Plane** with multiple first-class human interfaces that stay continuously synced: **Web**, **Desktop**, **TUI**, and **Mobile**. Surfaces are not thin shells over different backends; they co-mingle over long-lived connections (WebSocket or equivalent) as one session fabric—analogous to multi-client AI stacks (web + desktop + CLI) that share state and invoke each other as tools/interfaces without friction.

**Crawl execution** remains on a **Local Agent** (ADR-0004). The Desktop app is the primary vehicle that **installs and manages** the Agent and related background tools on the machine. There is **no** self-hosted “run the whole OS on a local server” deployment model for the Control Plane; the SaaS is always remote. TUI and Mobile participate in the same sync fabric (kickoff, monitor, review, act) even when they cannot host the full Agent.

**Ambition:** at MVP, technical audit capability should clearly surpass Screaming Frog / Sitebulb for agency multi-tenant workflows (not merely match a desktop spider UI).

**Considered:** web-only + optional agent; desktop-only spider; self-hosted single-node OS. Rejected in favor of seamless multi-surface mesh + agent-backed fetch.
