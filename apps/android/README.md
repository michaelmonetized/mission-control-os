# Mission Control Android

Kotlin + Jetpack Compose surface (ADR-0005 / 0006 / 0010).

## Stack (planned)

| Layer | Choice |
|-------|--------|
| UI | Jetpack Compose |
| Auth | Clerk Android |
| Data | Convex / Control Plane HTTP |
| Agent | Not on device; Local Agent is desktop/laptop daemon |

## Layout

```
app/src/main/java/com/missioncontrol/app/
  MainActivity.kt
  ui/CockpitScreen.kt
  ui/theme/Theme.kt
```

## Status

Scaffold with full module list (matches web cockpit). Next: Clerk Android + Convex.

### Clerk wire checklist

1. Gradle: Clerk Android SDK + Compose AuthView / UserButton
2. `Clerk.initialize(publishableKey)` in Application
3. Org context for Agency staff; Client portal users outside org (ADR-0026)
4. Convex JWT template `convex` + HTTP Control Plane fallback

Open in Android Studio and wire Gradle when ready.
