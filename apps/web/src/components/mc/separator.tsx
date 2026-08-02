import { Separator as Ui } from "@/components/ui/separator";
import { cn } from "cnfast";
import * as React from "react";

export function Separator({ className, ...props }: React.ComponentProps<"div">) {
  return <Ui className={cn("mc-glass rounded-[var(--radius-sm)]", className)} {...props} />;
}
