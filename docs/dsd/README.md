# Design System Docs (DSDs)

Brand, visual language, media kit, and frontend design packages for **Mission Control**.

Hammered via grill-with-docs. Architecture ADRs live in `docs/adr/`; domain language in root `CONTEXT.md`. Design-system decisions land here as **DSDs** (`docs/dsd/NNNN-slug.md`) plus living guidelines.

## Planned deliverables

| Doc / package | Purpose |
|---------------|---------|
| Brand guidelines | Voice, personality, positioning, naming |
| Visual foundations | Color, type, space, elevation, motion, iconography |
| Component / pattern inventory | UI primitives and agency-OS patterns |
| Media kit | Logo lockups, wordmark, social avatars, press assets |
| Frontend design packages | Tokens + shared UI for Web/Electron (and guidance for native/TUI) |
| Accessibility & density | WCAG targets, compact vs comfortable, multi-surface |

## Status

**Grilling in progress.** Locked DSDs:

| ID | Topic |
|----|--------|
| [0001](./0001-brand-personality.md) | Sparse cockpit personality |
| [0002](./0002-visual-foundations.md) | Glass, Mocha, neon, skeuomorph |
| [0003](./0003-brand-accents-flamingo-sky.md) | Flamingo + Sky |
| [0004](./0004-typography-neue-haas.md) | Neue Haas / max* |
| [0005](./0005-radius-scale-and-nesting.md) | Radius + nested calc |
| [0006](./0006-logo-launch-keyhole.md) | Launch keyhole + max95 wordmark |
| [0007](./0007-shadcn-mirror-abstraction.md) | Untouched shadcn + MC mirror + cn-fast |

## Naming

- **DSD** = Design System Document (decision or living guideline under `docs/dsd/`)
- **ADR** = Architecture Decision Record (`docs/adr/`) — keep separate
