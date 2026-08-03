import * as React from "react";
import { Badge as BaseBadge, type BadgeProps as BaseBadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Mission Control branded Badge wrapper (DSD-0007) */
export function Badge({ className, ...props }: BaseBadgeProps) {
  return (
    <BaseBadge
      className={cn("tracking-wide font-medium shadow-xs", className)}
      {...props}
    />
  );
}
