import { DropdownMenu as Ui } from "@/components/ui/dropdown-menu";
import { cn } from "cnfast";
import * as React from "react";

export function DropdownMenu({ className, ...props }: React.ComponentProps<"div">) {
  return <Ui className={cn("mc-glass rounded-[var(--radius-sm)]", className)} {...props} />;
}
