import * as React from "react";
import { cn } from "cnfast";

/** Alert banner — shadcn-style (DSD-0010). */
export function Alert({
  className,
  variant = "default",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "destructive" | "success";
}) {
  return (
    <div
      role="alert"
      className={cn(
        "relative w-full rounded-[var(--radius-md)] border px-4 py-3 text-sm",
        variant === "default" &&
          "border-[var(--color-mocha-surface1)] bg-[var(--color-mocha-surface0)] text-[var(--color-mocha-text)]",
        variant === "destructive" &&
          "border-[color-mix(in_oklab,var(--color-brand-flamingo)_50%,transparent)] bg-[color-mix(in_oklab,var(--color-brand-flamingo)_12%,transparent)] text-[var(--color-mocha-text)]",
        variant === "success" &&
          "border-[color-mix(in_oklab,var(--color-brand-sky)_45%,transparent)] bg-[color-mix(in_oklab,var(--color-brand-sky)_12%,transparent)] text-[var(--color-mocha-text)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h5 className={cn("mb-1 font-medium leading-none tracking-tight", className)} {...props} />;
}

export function AlertDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <div className={cn("text-sm text-[var(--color-mocha-subtext0)] [&_p]:leading-relaxed", className)} {...props} />;
}
