import { Tabs as Ui } from "@/components/ui/tabs";
import { cn } from "cnfast";
import * as React from "react";

export function Tabs({ className, ...props }: React.ComponentProps<"div">) {
  return <Ui className={cn("mc-glass rounded-[var(--radius-sm)]", className)} {...props} />;
}
