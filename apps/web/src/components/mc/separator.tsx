import * as React from "react";
import { Separator as BaseSeparator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/** Mission Control branded Separator wrapper (DSD-0007) */
export function Separator({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof BaseSeparator>) {
  return (
    <BaseSeparator
      className={cn("bg-[var(--color-mocha-surface0)]", className)}
      {...props}
    />
  );
}
