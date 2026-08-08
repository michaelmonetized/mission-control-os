# Mission Control Android

Kotlin + Jetpack Compose surface (ADR-0005 / 0006 / 0010).

## Stack

| Layer | Choice |
|-------|--------|
| UI | Jetpack Compose |
| Auth | **AuthGate** + `AuthViewModel` / `ClerkAuthBridge` — clerk-android when Gradle linked |
| Data | Convex / Control Plane HTTP |
| Agent | Not on device; Local Agent is desktop/laptop daemon |

## Auth shell (shipped)

```
app/src/main/java/com/missioncontrol/app/
  MainActivity.kt          — AuthGate entry
  auth/
    AuthModels.kt          — McAuthUser, AuthSurface, ClerkAuthBridge
    MockClerkAuthBridge.kt
    AuthViewModel.kt
    AuthGate.kt            — sign-in / agency / portal
```

Surfaces:

1. **Signed out** — SignInShell (Clerk AuthView slot + mock)
2. **Agency staff** — org present → CockpitScreen modules
3. **Client portal** — no org → PortalScreen (ADR-0026)

## Clerk wire checklist

1. Gradle: [Clerk Android](https://clerk.com/docs/references/android/overview) + Compose AuthView
2. Implement `ClerkAuthBridge` with real session APIs
3. `Clerk.initialize(publishableKey)` in `Application`
4. Org context for Agency staff; Client portal users outside org
5. Convex JWT template `convex`

Open in Android Studio when ready.
