# DSD-0010: Mirror all available shadcn components

Extends DSD-0007.

## Scope

Mission Control maintains an **MC mirror for every shadcn/ui component** installed by the house init path (`cna` / `shadcn add -ayo` / full registry set available to the project)—not a cherry-picked subset.

## Rules

1. After shadcn add/update, ensure `components/mc/*` has a wrapper for **each** `components/ui/*` entry that is a component module.
2. New shadcn components → add mirror in the same PR before feature code imports them.
3. Product code **never** imports from `components/ui` directly.
4. Mirrors may be thin (`cn-fast` default classes only) until a screen needs deeper skeuomorph/glass treatment.

## Why

User lock: “all available”—avoids mixed import styles and partial design-system coverage.
