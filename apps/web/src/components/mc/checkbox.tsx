import * as React from "react";
import { Checkbox as BaseCheckbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

/** Mission Control branded Checkbox wrapper (DSD-0007) */
export function Checkbox({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof BaseCheckbox>) {
  return (
    <BaseCheckbox
      className={cn(
        "border-[var(--color-mocha-surface2)] data-[state=checked]:bg-[var(--color-brand-sky)] data-[state=checked]:text-[var(--color-mocha-crust)] transition-colors",
        className,
      )}
      {...props}
    />
  );
}
