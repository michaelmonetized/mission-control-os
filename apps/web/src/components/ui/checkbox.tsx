import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { cn } from "@/lib/utils";

export function Checkbox({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "peer h-4 w-4 shrink-0 rounded-[var(--radius-xs)] border border-[var(--color-mocha-surface1)]",
        "data-[state=checked]:bg-[color-mix(in_oklab,var(--color-brand-sky)_40%,transparent)] data-[state=checked]:border-[var(--color-brand-sky)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-sky)]",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-[var(--color-brand-sky)] text-[10px]">
        ✓
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
