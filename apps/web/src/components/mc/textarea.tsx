import { Textarea as Ui } from "@/components/ui/textarea";
import { cn } from "cnfast";
import * as React from "react";

export function Textarea({ className, ...props }: React.ComponentProps<"div">) {
  return <Ui className={cn("mc-glass rounded-[var(--radius-sm)]", className)} {...props} />;
}
