import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[color-mix(in_oklab,var(--color-brand-sky)_20%,transparent)] text-[var(--color-brand-sky)]",
        secondary:
          "border-[var(--color-mocha-surface1)] text-[var(--color-mocha-subtext0)]",
        destructive:
          "border-transparent bg-[color-mix(in_oklab,var(--color-mocha-red)_25%,transparent)] text-[var(--color-mocha-red)]",
        outline: "border-[var(--color-mocha-surface1)] text-[var(--color-mocha-text)]",
        flamingo:
          "border-transparent bg-[color-mix(in_oklab,var(--color-brand-flamingo)_25%,transparent)] text-[var(--color-brand-flamingo)]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
