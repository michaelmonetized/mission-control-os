import * as React from "react";
import {
  Card as UCard,
  CardContent as UCardContent,
  CardDescription as UCardDescription,
  CardHeader as UCardHeader,
  CardTitle as UCardTitle,
} from "@/components/ui/card";
import { cn } from "cnfast";

export function Card({ className, style, ...props }: React.ComponentProps<"div">) {
  return (
    <UCard
      className={cn("mc-glass border-0", className)}
      style={
        {
          "--radius": "var(--radius-lg)",
          "--padding": "1.5rem",
          borderRadius: "var(--radius-lg)",
          ...style,
        } as React.CSSProperties
      }
      {...props}
    />
  );
}
export function CardHeader(props: React.ComponentProps<"div">) {
  return <UCardHeader {...props} />;
}
export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return <UCardTitle className={cn("text-[var(--color-mocha-text)] font-semibold", className)} {...props} />;
}
export function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <UCardDescription className={cn("text-[var(--color-mocha-subtext0)]", className)} {...props} />
  );
}
export function CardContent(props: React.ComponentProps<"div">) {
  return <UCardContent {...props} />;
}
