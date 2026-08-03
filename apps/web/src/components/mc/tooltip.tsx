import * as React from "react";
import { cn } from "cnfast";

/**
 * Lightweight tooltip — shadcn-style API without radix dependency (DSD-0010).
 * Hover/focus to show title text.
 */
export function Tooltip({
  content,
  children,
  className,
  side = "top",
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  side?: "top" | "bottom";
}) {
  return (
    <span className={cn("relative inline-flex group", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[10px]",
          "bg-[var(--color-mocha-surface0)] text-[var(--color-mocha-text)] border border-[var(--color-mocha-surface1)]",
          "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity",
          side === "top" ? "bottom-full mb-1" : "top-full mt-1",
        )}
      >
        {content}
      </span>
    </span>
  );
}
