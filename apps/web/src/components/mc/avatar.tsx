import { Avatar as Ui } from "@/components/ui/avatar";
import { cn } from "cnfast";
import * as React from "react";

export function Avatar({ className, ...props }: React.ComponentProps<"div">) {
  return <Ui className={cn("mc-glass rounded-[var(--radius-sm)]", className)} {...props} />;
}
