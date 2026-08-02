import { ScrollArea as Ui } from "@/components/ui/scroll-area";
import { cn } from "cnfast";
import * as React from "react";

export function ScrollArea({ className, ...props }: React.ComponentProps<"div">) {
  return <Ui className={cn("mc-glass rounded-[var(--radius-sm)]", className)} {...props} />;
}
