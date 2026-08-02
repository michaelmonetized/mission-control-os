import * as React from "react";
import { Input as ShadcnInput } from "@/components/ui/input";
import { cn } from "cnfast";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <ShadcnInput
      className={cn(
        "mc-neu mc-neon-focus rounded-[var(--radius-sm)] border-[color-mix(in_oklab,var(--color-brand-sky)_20%,transparent)] bg-[color-mix(in_oklab,var(--color-mocha-mantle)_90%,transparent)] text-[var(--color-mocha-text)] placeholder:text-[var(--color-mocha-subtext0)]",
        className,
      )}
      {...props}
    />
  );
}
