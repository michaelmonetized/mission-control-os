import * as React from "react";
import { cn } from "@/lib/utils";

/** Scaffold placeholder — expand with full shadcn implementation (issue #15). */
export function DropdownMenu({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn(className)} {...props} />;
}
