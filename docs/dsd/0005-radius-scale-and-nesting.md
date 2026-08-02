# DSD-0005: Radius scale + nested padding-aware rounding

## Base scale (soft / “game glow” — option C)

CSS variables (px; rem equivalent OK in tokens package):

| Token | Value | Typical use |
|-------|-------|-------------|
| `--radius-xs` | `8px` | chips, small controls |
| `--radius-sm` | `12px` | inputs, buttons |
| `--radius-md` | `16px` | cards, menus |
| `--radius-lg` | `24px` | glass panels, sheets |
| `--radius-xl` | `32px` | hero shells, modals |

Sparse cockpit still applies: large radii on few large surfaces, not every nested div at `xl`.

## Nested rounding (padding-aware)

Rounded children inside padded rounded parents **must not** use a disconnected raw token. Radius **scales with the parent’s padding** so the inner curve relates to the outer shell (hardware / skeuomorph / glass stack feel).

### Locked formula (additive)

User-specified model:

```text
child-radius = --radius + --padding
```

Example: parent uses base radius `8px` (`--radius-xs`) and padding `1em` → child uses:

```css
border-radius: calc(var(--radius) + var(--padding));
/* e.g. calc(8px + 1em) */
```

In Tailwind-style utilities (illustrative):

```html
<!-- conceptual -->
class="rounded-[calc(var(--radius)+var(--padding))]"
```

or with spacing vars:

```css
.nested-round {
  --radius: var(--radius-xs); /* 8px */
  --padding: 1em;             /* match parent padding token */
  border-radius: calc(var(--radius) + var(--padding));
}
```

Prefer **shared CSS variables** on the parent (`--radius`, `--padding` / `--pad`) so children inherit and `calc` stays consistent. Avoid hard-coding `8+16` in components.

### Implementation notes

- Parent sets `--radius` and `--padding` (or `--pad-x` / `--pad` if asymmetric—use the edge relevant to the curve, usually the uniform pad).
- Child consumes `border-radius: calc(var(--radius) + var(--padding))` (or a utility `rounded-nested`).
- Multi-level nesting: each level redefines `--radius` to its computed radius before the next child calcs, **or** document a single shell+content pair only (recommended for sparse UI: one glass shell, one content well).

### Note on concentric geometry

Some systems use **subtractive** concentric curves (`R_child = R_parent − padding`) so arcs share a center. Mission Control locks the **additive** rule above per product direction; do not “fix” to subtractive without a new DSD.

## Glass panels

Large glass panels default to `--radius-lg` / `--radius-xl`. Inner wells use nested calc so neumorph/skeuomorph controls sit in a radius-matched pocket.
