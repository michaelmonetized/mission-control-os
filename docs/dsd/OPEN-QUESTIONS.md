# Design open questions (DSD grill wrapped)

## Done in this pass

- Personality, glass/Mocha/neon/skeuomorph, Flamingo/Sky, Max type, radius nesting, launch keyhole + max95 wordmark, shadcn mirror architecture, media kit vector source, φ spacing/type from test-create-next-app, mirror-all shadcn, command palette deferred to ADR.

## Still open

1. **Vector publish** — copy keyhole SVG from iCloud Documents into `docs/dsd/media/` or brand package when ready (source location locked: iCloud Documents).
2. **Shared package name** — monorepo path vs `@mission-control/ui` when web/Electron repos exist.
3. **Elevation/motion token table** — numeric shadow/glow durations beyond prose in DSD-0002.
4. **Icon set** — Icon Factory–grade custom vs Lucide inside shadcn mirrors.
5. **TUI color mapping** — full Mocha ANSI table.
6. **Client portal glow intensity** — one-step calmer tokens or same as Agency.
7. **Print / PDF report styles** for audit exports.
8. **Full keymap table** — document every Superhuman-ish / vim bind when app shell lands (DSD-0011 seed).

## Resolved this pass

- **cnfast** = [aidenybai/cnfast](https://github.com/aidenybai/cnfast) (npm `cnfast`)
- **Keyhole vector** = iCloud Documents (owner)
- **Command palette** = vim motions + Superhuman-ish keybinds (DSD-0011)

Prefer new DSDs over silent changes.
