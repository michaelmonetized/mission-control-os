import { Dialog as Ui } from "@/components/ui/dialog";
import { cn } from "cnfast";
import * as React from "react";

export function Dialog({ className, ...props }: React.ComponentProps<"div">) {
  return <Ui className={cn("mc-glass rounded-[var(--radius-sm)]", className)} {...props} />;
}
