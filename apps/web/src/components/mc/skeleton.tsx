import { cn } from "cnfast";

/** Skeleton placeholder — shadcn mirror (DSD-0010). */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[color-mix(in_oklab,var(--color-mocha-surface1)_80%,transparent)]",
        className,
      )}
    />
  );
}
