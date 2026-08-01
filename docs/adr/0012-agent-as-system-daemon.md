# Local Agent is an OS system daemon

The Local Agent is installed and run as a **system (or user) service**, not as a child process of the Desktop app:

| Platform | Service model (illustrative) |
|----------|------------------------------|
| macOS | launchd agent/daemon |
| Linux | systemd user or system unit |
| Windows | Windows Service |

**Desktop (Electron)** is a UI Surface only for Agent lifecycle in the steady state: it discovers the daemon, talks **IPC** (socket / named pipe / local HTTP), shows status, and may trigger install/repair—but does **not** own the crawl process tree. TUI, Web, and Mobile reach crawl execution through the Control Plane + Sync Fabric; the daemon is what actually fetches Sites when online and authenticated to the Agency.

Installers (Desktop installer and/or standalone Agent package) register and enable the service. Always-on schedule-friendly operation is the default posture.

## Why

- Scheduled Crawl Runs and multi-User agencies need the Agent alive without Electron open (ADR-0004 D1 + agency ops in ADR-0008).
- Sidecar-tied-to-Desktop (A) recreates “close the app, product dies.”
- Clear separation: **Surface** vs **Agent** process boundaries.

## Considered

- Electron sidecar spawn (A) — simpler install, weak always-on.
- Manual user-started binary (B) — too easy to leave off.
- Sidecar now, service later (D) — deferred always-on; rejected for MVP.

## Consequences

- Installer complexity and privilege model (user-level vs machine-level service) must be designed carefully.
- Daemon must auto-update or be updated by installer without breaking IPC protocol versioning.
- Headless machines (office mini-PC / VPS) install **Agent-only** without Desktop.
- Desktop-less operators can still use Web/TUI/Mobile against a running daemon linked to their Agency.
