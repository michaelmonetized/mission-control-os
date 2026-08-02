# DSD-0007: shadcn/ui mirror abstraction (web + Electron)

## Intent

Mission Control UI on **Web** and **Electron** is built so **upstream shadcn/ui can be updated without a rewrite of product chrome**.

## Layout

```
…
├── components/ui/              # UNTOUCHED shadcn/ui primitives (CLI-owned)
│   ├── button.tsx
│   ├── dialog.tsx
│   └── …
└── components/mc/              # Mission Control abstractions (product-owned)
    ├── button.tsx              # mirrors ui/button API surface
    ├── dialog.tsx
    └── …
```

Exact folder names can be `components/ui` + `components/mc` (or `primitives` / `branded`)—**two trees** is the rule:

| Tree | Rule |
|------|------|
| **shadcn tree** | Generated/updated by shadcn CLI only. **No** Mission Control glass/neon/Max hacks. Treat as vendor. |
| **MC mirror tree** | One wrapper (or thin re-export + styling layer) **per** consumed shadcn component. Product code imports **only** from here. |

## How wrappers work

1. Import the untouched shadcn component from `components/ui/…`.
2. Re-export a Mission Control component with the **same (or extended) props API** so call sites stay stable.
3. Apply brand styling via **`cn-fast`** (house class-merge helper—wire to the actual package/util in implementation) to compose:
   - glass / neon border / neumorph / Max type tokens  
   - nested radius helpers  
   - Flamingo/Sky accents  
4. Prefer `className` merge + token classes over forking shadcn source.

```tsx
// conceptual — components/mc/button.tsx
import { Button as ShadcnButton } from "@/components/ui/button";
import { cnFast } from "@/lib/cn-fast";

export function Button({ className, ...props }: React.ComponentProps<typeof ShadcnButton>) {
  return (
    <ShadcnButton
      className={cnFast(
        "/* MC glass + skeuomorph + neon focus tokens */",
        className,
      )}
      {...props}
    />
  );
}
```

## Update path when shadcn changes

1. Run shadcn update into `components/ui/` only.  
2. Diff wrappers in `components/mc/` for prop/API breaks.  
3. Adjust mirrors—**not** every screen.  

## Scope

- **In:** Web app, Electron app (shared package or copied structure).  
- **Out:** Swift/Kotlin native kits (may share tokens only); TUI (ANSI/Mocha mapping).  
- shadcn remains the **interaction primitive** base; MC mirror is the **design-system face**.

## Why

User direction: abstraction over **untouched** shadcn so upgrades don’t force a full refactor; brand Tailwind reapplied in mirrors via **cn-fast**.

## Open implementation detail

Confirm exact `cn-fast` package vs house `cn`/`cx` util when scaffolding the frontend package—name is reserved in docs until wired.
