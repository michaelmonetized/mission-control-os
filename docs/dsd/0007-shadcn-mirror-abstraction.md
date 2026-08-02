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
3. Apply brand styling via **[cnfast](https://github.com/aidenybai/cnfast)** (`npm i cnfast`) — fast drop-in `cn` (clsx + tailwind-merge compatible, ~3.8× faster on average). Use in mirrors as `import { cn } from "cnfast"` (or re-export as house `cn` / `cnFast` alias).
4. Prefer `className` merge + token classes over forking shadcn source.

```tsx
// conceptual — components/mc/button.tsx
import { Button as ShadcnButton } from "@/components/ui/button";
import { cn } from "cnfast";

export function Button({ className, ...props }: React.ComponentProps<typeof ShadcnButton>) {
  return (
    <ShadcnButton
      className={cn(
        "/* MC glass + skeuomorph + neon focus tokens */",
        className,
      )}
      {...props}
    />
  );
}
```

shadcn projects can also: `npx shadcn@latest add aidenybai/cnfast/cn`

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

## Dependency

- **Package:** [`cnfast`](https://github.com/aidenybai/cnfast) / npm `cnfast` (Aiden Bai)
- **Role:** class merge for all MC mirrors and product UI
