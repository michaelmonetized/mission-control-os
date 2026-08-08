import * as React from "react";
import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  tableFeatures,
  useTable,
  type ColumnDef,
  type RowData,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/mc/table";
import { Button } from "@/components/mc/button";
import { Input } from "@/components/mc/input";
import { cn } from "@/lib/utils";

/** Stock features for MC product tables: sort + filter + paginate. */
export const mcTableFeatures = tableFeatures({
  columnFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  filterFns: { includesString: filterFn_includesString },
  sortFns: { alphanumeric: sortFn_alphanumeric },
});

export type McTableFeatures = typeof mcTableFeatures;

export function createMcColumnHelper<TData extends RowData>() {
  return createColumnHelper<McTableFeatures, TData>();
}

export type McColumnDef<TData extends RowData, TValue = unknown> = ColumnDef<
  McTableFeatures,
  TData,
  TValue
>;

export type DataTableProps<TData extends RowData> = {
  columns: McColumnDef<TData, any>[];
  data: TData[];
  filterColumn?: string;
  filterPlaceholder?: string;
  pageSize?: number;
  className?: string;
  emptyMessage?: string;
};

const EMPTY: RowData[] = [];

/**
 * TanStack Table v9 + MC Table chrome (shadcn Data Table pattern).
 * Presentational Table stays in mc/table; headless logic is useTable + features.
 */
export function DataTable<TData extends RowData>({
  columns,
  data,
  filterColumn,
  filterPlaceholder = "Filter…",
  pageSize = 10,
  className,
  emptyMessage = "No results.",
}: DataTableProps<TData>) {
  const tableData = (data.length ? data : EMPTY) as TData[];

  const table = useTable(
    {
      features: mcTableFeatures,
      columns,
      data: tableData,
      initialState: {
        pagination: { pageIndex: 0, pageSize },
      },
    },
    (state) => ({
      sorting: state.sorting,
      columnFilters: state.columnFilters,
      pagination: state.pagination,
    }),
  );

  const filterValue =
    filterColumn != null
      ? (table.getColumn(filterColumn)?.getFilterValue() as string | undefined)
      : undefined;

  return (
    <div className={cn("space-y-3", className)}>
      {filterColumn ? (
        <Input
          placeholder={filterPlaceholder}
          value={filterValue ?? ""}
          onChange={(e) =>
            table.getColumn(filterColumn)?.setFilterValue(e.target.value)
          }
          className="max-w-[20rem]"
        />
      ) : null}
      <div className="overflow-x-auto rounded-lg border border-[var(--color-mocha-surface1)]">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap">
                    {header.isPlaceholder ? null : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-[var(--color-mocha-subtext0)]"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end gap-2">
        <span className="text-xs text-[var(--color-mocha-subtext0)]">
          Page {(table.state.pagination?.pageIndex ?? 0) + 1} of{" "}
          {Math.max(table.getPageCount(), 1)}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
