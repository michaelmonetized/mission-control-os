import * as React from "react";
import { cn } from "@/lib/utils";

/** Minimal sheet base (DSD-0010) — MC mirror owns glass chrome */
export function Sheet({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      {children}
    </div>
  );
}

export function SheetContent({
  className,
  children,
  side = "right",
}: {
  className?: string;
  children: React.ReactNode;
  side?: "right" | "left";
}) {
  return (
    <div
      className={cn(
        "absolute top-0 h-full w-full max-w-[28rem] bg-background p-6 shadow-lg",
        side === "right" ? "right-0" : "left-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
