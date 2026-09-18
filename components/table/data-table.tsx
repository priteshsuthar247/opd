"use client";

import type { ReactNode } from "react";
import {
  flexRender,
  type ReactTable,
  type RowData,
} from "@tanstack/react-table";
import { DownloadIcon, XIcon } from "lucide-react";
import { tableFeaturesFull } from "@/components/table/table-helpers";
import { Button } from "@/components/ui/button";
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
// search and faceted filters, bordered table, empty state, pagination.
// Fixed on our shared feature set so row/cell APIs resolve; generic only
// on the row data, keeping full type-checking at each call site.
type AppFeatures = typeof tableFeaturesFull;

export function DataTable<TData extends RowData>({
  table,
  total,
  searchPlaceholder,
  facets,
  empty,
  exportFilename,
}: {
  table: ReactTable<AppFeatures, TData> & FilterableTable & PaginatedTable;
  total: number;
  searchPlaceholder?: string;
  facets?: FacetFilter[];
  empty: ReactNode;
  exportFilename?: string;
}) {
  const rows = table.getRowModel().rows;
  const selected = table.getSelectedRowModel().rows;

  function exportSelected() {
    if (!exportFilename || selected.length === 0) return;
    const cols = table
      .getAllColumns()
      .filter((c) => c.id !== "select" && c.id !== "actions");
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
      <div className="overflow-hidden rounded-md border">
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
