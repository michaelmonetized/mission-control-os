# Design open questions (DSD grill wrapped)

## Done in this pass

- Personality, glass/Mocha/neon/skeuomorph, Flamingo/Sky, Max type, radius nesting, launch keyhole + max95 wordmark, shadcn mirror architecture, media kit vector source, φ spacing/type from test-create-next-app, mirror-all shadcn, command palette deferred to ADR.

## Still open

1. **Vector file path** — commit SVG into `docs/dsd/media/` or keep only private; JPEG is reference only.
2. **cn-fast** — exact package/util implementation.
3. **Shared package name** — monorepo path vs `@mission-control/ui` when web/Electron repos exist.
4. **Elevation/motion token table** — numeric shadow/glow durations beyond prose in DSD-0002.
5. **Icon set** — Icon Factory–grade custom vs Lucide inside shadcn mirrors.
6. **TUI color mapping** — full Mocha ANSI table.
7. **Client portal glow intensity** — one-step calmer tokens or same as Agency.
8. **Print / PDF report styles** for audit exports.

Prefer new DSDs over silent changes.
