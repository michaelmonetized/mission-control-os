# MVP shared vertical: full audit loop on every Surface

“All Surfaces equal” (ADR-0006) means every Surface can complete the **full technical audit loop**, not merely watch Desktop:

1. Select Location / Site  
2. Start a Crawl Run (Agent executes; Desktop hosts Agent)  
3. Observe live progress over the Sync Fabric  
4. Browse Audit Findings  
5. Open page-level detail  

Web, Desktop, TUI, and Mobile all support this loop; density and chrome differ by form factor. Agent install/management remains Desktop-primary.

**Why:** Second-class “monitor only” Surfaces would contradict the multi-surface OS bet and train the Sync Fabric around incomplete commands.

**Considered:** monitor/triage-only thin Surfaces (B); read-only companions (C); full command parity without defining the vertical (D alone). Chose a single named vertical—the audit loop—as the shared definition of done.
