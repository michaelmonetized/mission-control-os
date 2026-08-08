import * as React from "react";
import { cn } from "cnfast";

/** Progress bar — shadcn mirror (DSD-0010). */
export function Progress({
  value = 0,
  className,
  indicatorClassName,
  "aria-label": ariaLabel = "Progress",
}: {
  value?: number;
  className?: string;
  indicatorClassName?: string;
  "aria-label"?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-[var(--color-mocha-surface1)]",
        className,
      )}
    >
      <div
        className={cn(
          "h-full rounded-full bg-[var(--color-brand-sky)] transition-[width] duration-300",
          indicatorClassName,
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
