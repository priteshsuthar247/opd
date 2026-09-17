"use client";

import {
  createPaginatedRowModel,
  createSortedRowModel,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
} from "@tanstack/react-table";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// One feature set for every table in the app: client-side sorting plus
// pagination. Module scope — static config shared by all tables.
export const tableFeaturesFull = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
});

export const defaultPageSize = 10;

// Structural sort API: the real Column type composes these methods in via
// the sorting feature, which generic code can't name — but every table
// built on tableFeaturesFull carries them, verified by tsc at each site.
export type SortableColumn = {
  getCanSort: () => boolean;
  getIsSorted: () => false | "asc" | "desc";
  getToggleSortingHandler: () => ((event: unknown) => void) | undefined;
};

function SortButton({ column, label }: { column: SortableColumn; label: string }) {
  const toggle = column.getCanSort() ? column.getToggleSortingHandler() : undefined;
  if (!toggle) return <span>{label}</span>;
  const dir = column.getIsSorted();
  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center gap-1 hover:text-foreground"
      aria-label={`Sort by ${label}`}
    >
      {label}
      {dir === "asc" ? (
        <ArrowUpIcon className="size-3" />
      ) : dir === "desc" ? (
        <ArrowDownIcon className="size-3" />
      ) : (
        <ChevronsUpDownIcon className="size-3 text-muted-foreground" />
      )}
    </button>
  );
}

// Column header factory: header: sortHeader("Name"). The context param is
// deliberately the { column } subset — full contexts assign to it, with
// the real method presence checked per table by tsc.
export function sortHeader(label: string) {
  function SortableHeader({ column }: { column: SortableColumn }) {
    return <SortButton column={column} label={label} />;
  }
  return SortableHeader;
}

export type PaginatedTable = {
  getPageCount: () => number;
  getCanPreviousPage: () => boolean;
  getCanNextPage: () => boolean;
  previousPage: () => void;
  nextPage: () => void;
  state: { pagination: { pageIndex: number } };
};

export function TablePagination({
  table,
  total,
}: {
  table: PaginatedTable;
  total: number;
}) {
  const pages = table.getPageCount();
  if (pages <= 1) return null;
  const current = table.state.pagination.pageIndex + 1;
  return (
    <div className="flex items-center justify-between py-2 text-xs text-muted-foreground">
      <span>
        Page {current} of {pages} · {total} row{total === 1 ? "" : "s"}
      </span>
      <span className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
        >
          <ChevronLeftIcon />
          Prev
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
        >
          Next
          <ChevronRightIcon />
        </Button>
      </span>
    </div>
  );
}
