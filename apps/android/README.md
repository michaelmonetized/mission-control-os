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

Scaffold sources only. Open in Android Studio and wire Gradle when ready.
