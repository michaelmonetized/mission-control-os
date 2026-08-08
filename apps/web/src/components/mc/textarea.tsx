import * as React from "react";
import { Textarea as BaseTextarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/** Mission Control branded Textarea wrapper (DSD-0007) */
export function Textarea({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof BaseTextarea>) {
  return (
    <BaseTextarea
      className={cn(
        "bg-[var(--color-mocha-surface0)] border-[var(--color-mocha-surface1)] focus:border-[var(--color-brand-sky)] focus:ring-1 focus:ring-[var(--color-brand-sky)] text-[var(--color-mocha-text)] placeholder:text-[var(--color-mocha-overlay0)] transition-colors",
        className,
      )}
      {...props}
    />
  );
}
