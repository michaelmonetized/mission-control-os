import { Checkbox as Ui } from "@/components/ui/checkbox";
import { cn } from "cnfast";
import * as React from "react";

export function Checkbox({ className, ...props }: React.ComponentProps<"div">) {
  return <Ui className={cn("mc-glass rounded-[var(--radius-sm)]", className)} {...props} />;
}
