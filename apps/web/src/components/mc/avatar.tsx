import * as React from "react";
import {
  Avatar as BaseAvatar,
  AvatarImage as BaseAvatarImage,
  AvatarFallback as BaseAvatarFallback,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/** Mission Control branded Avatar wrapper (DSD-0007) */
export function Avatar({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof BaseAvatar>) {
  return (
    <BaseAvatar
      className={cn(
        "border border-[var(--color-mocha-surface1)] shadow-sm hover:border-[var(--color-brand-sky)] transition-colors",
        className,
      )}
      {...props}
    />
  );
}

export function AvatarImage(props: React.ComponentPropsWithoutRef<typeof BaseAvatarImage>) {
  return <BaseAvatarImage {...props} />;
}

export function AvatarFallback({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof BaseAvatarFallback>) {
  return (
    <BaseAvatarFallback
      className={cn(
        "bg-[var(--color-mocha-surface0)] text-[var(--color-brand-sky)] font-medium",
        className,
      )}
      {...props}
    />
  );
}
