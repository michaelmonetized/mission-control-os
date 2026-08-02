import * as React from "react";
import { Button as ShadcnButton, type ButtonProps } from "@/components/ui/button";
import { cn } from "cnfast";

/** MC mirror — brand glass / neon / skeuomorph (DSD-0007). */
export function Button({ className, variant = "default", ...props }: ButtonProps) {
  return (
    <ShadcnButton
      variant={variant}
      className={cn(
        "font-medium tracking-wide",
        "rounded-[var(--radius-sm)]",
        variant === "default" &&
          "mc-neu bg-[color-mix(in_oklab,var(--color-mocha-surface1)_80%,var(--color-brand-sky)_12%)] text-[var(--color-mocha-text)] border border-[color-mix(in_oklab,var(--color-brand-sky)_40%,transparent)] shadow-[0_0_20px_color-mix(in_oklab,var(--color-brand-sky)_25%,transparent)] hover:shadow-[0_0_28px_color-mix(in_oklab,var(--color-brand-sky)_40%,transparent)]",
        variant === "secondary" && "mc-glass text-[var(--color-mocha-text)]",
        variant === "outline" &&
          "mc-glass border-[color-mix(in_oklab,var(--color-brand-flamingo)_35%,transparent)]",
        "mc-neon-focus",
        className,
      )}
      {...props}
    />
  );
}
