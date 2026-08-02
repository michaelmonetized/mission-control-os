import { Select as Ui } from "@/components/ui/select";
import { cn } from "cnfast";
import * as React from "react";

export function Select({ className, ...props }: React.ComponentProps<"div">) {
  return <Ui className={cn("mc-glass rounded-[var(--radius-sm)]", className)} {...props} />;
}
