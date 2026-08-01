# MVP ships all four Surfaces at equal priority

v1 treats **Web, Desktop, TUI, and Mobile** as equal first-class Surfaces—not phased “web+desktop first, rest later.” All four speak the same Sync Fabric and Control Plane from day one. Desktop remains the install path for the Local Agent (ADR-0004, ADR-0005).

**Why:** Product identity is a seamless multi-surface OS (web ↔ desktop ↔ TUI ↔ mobile), not a spider with companion apps bolted on. Partial surface matrix would train users and engineers into second-class clients and fracture the fabric design.

**Considered:** Web+Desktop only (A); Desktop+TUI (B); Web+Desktop+Mobile with thin TUI (C). Rejected so protocol, auth, and UX contracts are forced to be surface-agnostic early.

**Consequences:**
- Engineering load is high; feature depth on Crawl/Audit must still clear the “mog Screaming Frog / Sitebulb” bar—surface parity does not excuse shallow crawl.
- Shared design system + Sync Fabric contracts are load-bearing; avoid four bespoke stacks.
- Release discipline: one vertical of audit value must work on every Surface, not four half-products.
