import * as React from "react";
import { cn } from "cnfast";

/**
 * Simple slide-over sheet — shadcn-style without full radix dep (DSD-0010).
 */
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
  side = "right",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { side?: "right" | "left" }) {
  return (
    <div
      role="dialog"
      aria-modal
      className={cn(
        "absolute top-0 bottom-0 w-full max-w-[28rem] mc-glass border-[var(--color-mocha-surface1)] p-6 shadow-xl overflow-y-auto",
        side === "right" ? "right-0 border-l" : "left-0 border-r",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 space-y-1", className)} {...props} />;
}

export function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold", className)} {...props} />;
}

export function SheetDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-[var(--color-mocha-subtext0)]", className)} {...props} />;
}
