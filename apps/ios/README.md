# Mission Control iOS

SwiftUI surface (ADR-0005 / 0006 / 0010). Equal priority with Web, Desktop, TUI, Android.

## Stack

| Layer | Choice |
|-------|--------|
| UI | SwiftUI |
| Auth | **AuthGateView** + `MCAuthSession` / `MCAuthProviding` — ClerkKit when SPM linked |
| Data | Convex Swift client or Control Plane HTTP + Sync Fabric |
| Agent | Does **not** crawl; observes Control Plane only |

## Auth shell (shipped)

```
Sources/MissionControl/
  Auth/
    MCAuthSession.swift      — session + MockClerkAuthBridge
    AuthGateView.swift       — sign-in / agency cockpit / client portal
    ClerkAuthBridge.md       — real ClerkKit wiring notes
  MissionControlApp.swift    — MissionControlRoot → AuthGateView
  ContentView.swift          — agency module list
```

Surfaces:

1. **Signed out** — SignInShellView (Clerk AuthView slot + mock Agency / Portal)
2. **Agency staff** — org id present → cockpit modules (ADR-0015)
3. **Client portal** — no org membership → PortalShellView (ADR-0026)

## Clerk wire checklist

1. Add `ClerkKit` / `ClerkKitUI` SPM (`https://github.com/clerk/clerk-ios`)
2. Implement `ClerkAuthBridge: MCAuthProviding` (see `Auth/ClerkAuthBridge.md`)
3. `Clerk.configure(publishableKey:)` via `MCAuthSession`
4. Replace SignInShellView body with `AuthView()`
5. Convex JWT template `convex` (same as web)

```bash
cd apps/ios && swift build
```
