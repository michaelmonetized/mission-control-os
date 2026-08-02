# Mission Control iOS

SwiftUI surface (ADR-0005 / 0006 / 0010). Equal priority with Web, Desktop, TUI, Android.

## Stack (planned)

| Layer | Choice |
|-------|--------|
| UI | SwiftUI |
| Auth | Clerk iOS (`ClerkKit` / ClerkKitUI) — Agency org for staff; Client portal without org membership (ADR-0015/0026) |
| Data | Convex Swift client or Control Plane HTTP + Sync Fabric |
| Agent | Does **not** crawl; observes Control Plane only |

## Layout

```
MissionControl/
  Sources/MissionControl/
    MissionControlApp.swift
    ContentView.swift
    Auth/
    Cockpit/
  Package.swift
```

## Status

Scaffold only. Next: Xcode project / SPM package with Clerk + Convex wiring.

```bash
# When Package is buildable:
cd apps/ios && swift build
```
