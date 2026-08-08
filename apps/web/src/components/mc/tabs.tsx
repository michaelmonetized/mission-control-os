import * as React from "react";
import {
  Tabs as BaseTabs,
  TabsList as BaseTabsList,
  TabsTrigger as BaseTabsTrigger,
  TabsContent as BaseTabsContent,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/** Mission Control branded Tabs wrappers (DSD-0007) */
export const Tabs = BaseTabs;

export function TabsList({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof BaseTabsList>) {
  return (
    <BaseTabsList
      className={cn("bg-[var(--color-mocha-surface0)] p-1 border border-[var(--color-mocha-surface1)] rounded-lg", className)}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof BaseTabsTrigger>) {
  return (
    <BaseTabsTrigger
      className={cn(
        "data-[state=active]:bg-[var(--color-mocha-base)] data-[state=active]:text-[var(--color-brand-sky)] data-[state=active]:shadow-xs text-[var(--color-mocha-subtext0)] transition-all",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof BaseTabsContent>) {
  return <BaseTabsContent className={cn("mt-3 focus-visible:outline-hidden", className)} {...props} />;
}
