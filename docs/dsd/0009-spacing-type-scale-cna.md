# DSD-0009: Spacing & type scale — test-create-next-app (φ system)

Mission Control **inherits the spacing and fluid type scale** from the house **`test-create-next-app` / `cna`** theme (`HurleyUS/test-create-next-app` `app/globals.css` `@theme inline`), not an ad-hoc rem ladder.

## Core constants (φ)

```css
--phi: calc((1 + sqrt(5)) / 2);
--gwx: calc(var(--phi) - 1);
--gnx: calc(1 - var(--gwx));
--snx: calc(1 + var(--gnx));
--swx: var(--phi);
```

## Type scale

- **Core:** `--text-md: clamp(21px, calc(1dvw * var(--phi)), 28px)` (also `--text-core`)
- Steps via `pow(var(--snx), n)` clamps: `--text-xs` … `--text-9x` (and sm) as in test-create-next-app
- **Line height:** `--line-height: clamp(1, var(--gnx), var(--gwx))`
- **Face:** Max / Neue Haas Grotesque Pro (DSD-0004) applied on top of this scale

## Spacing scale

- **Base:** `--spacing-base: clamp(4px, calc(1rem * var(--gnx) / var(--swx)), 6px)`
- Steps: `--spacing-xs` … `--spacing-9x` (golden multipy via `--swx`) as in test-create-next-app
- **Golden containers:** `--container-gw`, `--container-gn`, halves/doubles for layout splits

## Aspect tokens

Keep golden / video / portrait / square / etc. from the same theme when useful for media and marketing.

## Nested radius

DSD-0005 `calc(var(--radius) + var(--padding))` should use **these spacing tokens** for `--padding` when possible (e.g. `--spacing-md`), not magic numbers.

## Source of truth

When scaffolding Web/Electron, **copy/port the `@theme inline` block** from `test-create-next-app` (via `cna` pipeline) and layer Mission Control color/glass tokens (DSD-0002/0003) on top—do not invent a second spacing system.
