import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

export function TabsList({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-mocha-surface0)] p-1 text-[var(--color-mocha-subtext0)]",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius-xs)] px-3 py-1.5 text-sm font-medium transition-all",
        "data-[state=active]:bg-[color-mix(in_oklab,var(--color-brand-sky)_14%,transparent)] data-[state=active]:text-[var(--color-brand-sky)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-sky)]",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn("mt-4 focus-visible:outline-none", className)}
      {...props}
    />
  );
}
