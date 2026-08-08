import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Minimal tooltip base without radix (DSD-0010).
 * MC mirror adds brand chrome.
 */
export function Tooltip({
  content,
  children,
  className,
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("relative inline-flex group", className)} title={typeof content === "string" ? content : undefined}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 transition-opacity group-hover:opacity-100"
      >
        {content}
      </span>
    </span>
  );
}
