import { Label as Ui } from "@/components/ui/label";
import { cn } from "cnfast";
import * as React from "react";

export function Label({ className, ...props }: React.ComponentProps<"div">) {
  return <Ui className={cn("mc-glass rounded-[var(--radius-sm)]", className)} {...props} />;
}
