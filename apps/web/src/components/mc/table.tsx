import * as React from "react";
import {
  Table as BaseTable,
  TableHeader as BaseTableHeader,
  TableBody as BaseTableBody,
  TableRow as BaseTableRow,
  TableHead as BaseTableHead,
  TableCell as BaseTableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/** Mission Control branded Table wrappers (DSD-0007) */
export function Table({ className, ...props }: React.ComponentPropsWithoutRef<typeof BaseTable>) {
  return <BaseTable className={cn("mc-glass rounded-lg text-sm", className)} {...props} />;
}

export function TableHeader({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof BaseTableHeader>) {
  return (
    <BaseTableHeader
      className={cn("bg-[var(--color-mocha-surface0)]/60 text-[var(--color-mocha-subtext0)]", className)}
      {...props}
    />
  );
}

export function TableBody({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof BaseTableBody>) {
  return <BaseTableBody className={cn("divide-y divide-[var(--color-mocha-surface0)]", className)} {...props} />;
}

export function TableRow({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof BaseTableRow>) {
  return (
    <BaseTableRow
      className={cn("hover:bg-[var(--color-mocha-surface0)]/40 transition-colors", className)}
      {...props}
    />
  );
}

export function TableHead({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof BaseTableHead>) {
  return (
    <BaseTableHead
      className={cn("text-xs font-semibold text-[var(--color-mocha-subtext1)] uppercase tracking-wider", className)}
      {...props}
    />
  );
}

export function TableCell({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof BaseTableCell>) {
  return <BaseTableCell className={cn("py-3 text-[var(--color-mocha-text)]", className)} {...props} />;
}
