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

Scaffold with full module list (matches web cockpit). Next: ClerkKit AuthView + org session + Convex.

### Clerk wire checklist

1. Add `ClerkKit` / `ClerkKitUI` SPM deps
2. `Clerk.configure(publishableKey:)` in app entry
3. `AuthView` for sign-in; OrganizationSwitcher for Agency
4. Client portal users: **no** Agency org membership (ADR-0026) — separate portal surface
5. Convex: JWT template `convex` (same as web) + Swift client or HTTP Control Plane

```bash
# When Package is buildable:
cd apps/ios && swift build
```
