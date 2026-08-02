import { Table as Ui } from "@/components/ui/table";
import { cn } from "cnfast";
import * as React from "react";

export function Table({ className, ...props }: React.ComponentProps<"div">) {
  return <Ui className={cn("mc-glass rounded-[var(--radius-sm)]", className)} {...props} />;
}
