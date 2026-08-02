import { Switch as Ui } from "@/components/ui/switch";
import { cn } from "cnfast";
import * as React from "react";

export function Switch({ className, ...props }: React.ComponentProps<"div">) {
  return <Ui className={cn("mc-glass rounded-[var(--radius-sm)]", className)} {...props} />;
}
