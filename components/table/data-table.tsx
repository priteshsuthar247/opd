"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import {
  flexRender,
  type ReactTable,
  type RowData,
} from "@tanstack/react-table";
import { ChevronRightIcon, DownloadIcon, XIcon } from "lucide-react";
import { tableFeaturesFull } from "@/components/table/table-helpers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { downloadCsv } from "@/components/admin/export-csv-button";
import {
  DataTableToolbar,
  TablePagination,
  type FacetFilter,
  type FilterableTable,
  type PaginatedTable,
} from "@/components/table/table-helpers";

// One master table for the whole app (tablecn-style shell): toolbar with
// search and faceted filters, desktop table, empty state, pagination.
// Fixed on our shared feature set so row/cell APIs resolve; generic only
// on the row data, keeping full type-checking at each call site.
// On small screens the table becomes a card list: each card shows the
// mobile summary, and tapping it opens a detail sheet with the full
// record (data + actions) supplied by renderExpanded.
type AppFeatures = typeof tableFeaturesFull;

export function DataTable<TData extends RowData>({
  table,
  total,
  searchPlaceholder,
  facets,
  empty,
  exportFilename,
  renderExpanded,
  mobileTitle,
  mobileSummary,
}: {
  table: ReactTable<AppFeatures, TData> & FilterableTable & PaginatedTable;
  total: number;
  searchPlaceholder?: string;
  facets?: FacetFilter[];
  empty: ReactNode;
  exportFilename?: string;
  renderExpanded?: (original: TData) => ReactNode;
  mobileTitle: (original: TData) => string;
  mobileSummary: (original: TData) => ReactNode;
}) {
  const rows = table.getRowModel().rows;
  const selected = table.getSelectedRowModel().rows;
  const [detail, setDetail] = useState<TData | null>(null);

  function exportSelected() {
    if (!exportFilename || selected.length === 0) return;
    const cols = table
      .getAllColumns()
      .filter(
        (c) => c.id !== "select" && c.id !== "actions" && c.id !== "expand"
      );
    downloadCsv(
      exportFilename,
      selected.map((r) => {
        const record: Record<string, unknown> = {};
        for (const c of cols) {
          const def = c.columnDef as {
            accessorKey?: unknown;
            accessorFn?: unknown;
          };
          // Display-only columns (computed cells) have no backing value.
          if (def.accessorKey === undefined && def.accessorFn === undefined)
            continue;
          record[c.id] = r.getValue(c.id);
        }
        return record;
      })
    );
  }
  return (
    <div className="flex w-full flex-col gap-2.5">
      <DataTableToolbar
        table={table}
        searchPlaceholder={searchPlaceholder}
        facets={facets}
      />
      <div className="hidden overflow-hidden border md:block">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id} colSpan={h.colSpan}>
                    {h.isPlaceholder
                      ? null
                      : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className="h-24 text-center"
                >
                  {empty}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {rows.length > 0 ? (
        <ul className="flex flex-col gap-2 md:hidden">
          {rows.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => setDetail(row.original)}
                className="flex w-full items-center gap-3 rounded-2xl border bg-card px-3 py-2.5 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {mobileTitle(row.original)}
                  </span>
                  <span className="mt-0.5 block">
                    {mobileSummary(row.original)}
                  </span>
                </span>
                <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="border py-12 text-center md:hidden">
          {empty}
        </div>
      )}
      <Dialog
        open={detail !== null}
        onOpenChange={(v) => {
          if (!v) setDetail(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {detail !== null ? mobileTitle(detail) : ""}
            </DialogTitle>
          </DialogHeader>
          {detail !== null && renderExpanded?.(detail)}
        </DialogContent>
      </Dialog>
      <TablePagination table={table} total={total} />
      {exportFilename && selected.length > 0 && (
        <div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-2 text-xs">
          <span>
            {selected.length} row{selected.length === 1 ? "" : "s"} selected
          </span>
          <span className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={exportSelected}>
              <DownloadIcon />
              Export CSV
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => table.resetRowSelection()}
            >
              <XIcon />
              Clear
            </Button>
          </span>
        </div>
      )}
    </div>
  );
}
