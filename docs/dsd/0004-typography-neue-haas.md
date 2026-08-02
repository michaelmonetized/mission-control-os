# DSD-0004: Typography — Neue Haas Grotesque Pro (“max”)

## Primary UI typeface

**Neue Haas Grotesque Pro** (Max Miedinger)—house-licensed, same files used across Uncap and related products.

CSS family name in existing apps: **`max`**.

### File naming convention

`max{weightDigit}{styleDigit}.(ttf|woff|eot|svg)`

| Style digit | Meaning |
|-------------|---------|
| **5** | Roman (normal) |
| **6** | Italic |

| Weight digit | CSS `font-weight` | File examples |
|--------------|-------------------|---------------|
| 1 | 100 Thin | `max15` / `max16` |
| 2 | 200 Ultra Light | `max25` / `max26` |
| 3 | 300 Light | `max35` / `max36` |
| 4 | 400 Roman | `max45` / `max46` |
| 5 | 500 Medium | `max55` / `max56` |
| 6 | 600 Bold | `max65` / `max66` |
| 7 | 700 Heavy? / Black step | `max75` / `max76` |
| 9 | 900 Black | `max95` / `max96` |

Reference implementation: `uncap.us` / `uncap.us-tanstack` → `public/max/*`, `styles/max.css`, `lib/fonts.ts`.

Mission Control **reuses this licensed set** (do not re-host illegally; copy from licensed house assets into the design/frontend package with license compliance).

## Hierarchy (sparse cockpit)

| Role | Weight | Notes |
|------|--------|--------|
| Display / hero | 600–900 | Sparse use; Ive restraint |
| Title | 500–600 | |
| Body | 400 | Default UI |
| Secondary | 300–400 | Subtext on Mocha |
| Label / overline | 500–600 | Tracking slightly open if needed |

## Mono

Code, crawl URLs, Agent logs, TUI: **system mono** or JetBrains Mono / SF Mono—not Neue Haas. TUI may use Nerd Font mono for icons.

## Native

iOS/Android: ship `max` webfont-equivalent files or licensed app fonts per platform license terms; fallback to SF Pro / Roboto only if packaging blocks.

## Why

User-specified house standard; already licensed and fleets-wide via `max*.ttf` pipeline. Aligns Superhuman-grade grotesque with sparse Apple layout.
