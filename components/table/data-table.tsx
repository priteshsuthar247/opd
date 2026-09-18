"use client";

import type { ReactNode } from "react";
import {
  flexRender,
  type ReactTable,
  type RowData,
} from "@tanstack/react-table";
import { tableFeaturesFull } from "@/components/table/table-helpers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
}: {
  table: ReactTable<AppFeatures, TData> & FilterableTable & PaginatedTable;
  total: number;
  searchPlaceholder?: string;
  facets?: FacetFilter[];
  empty: ReactNode;
}) {
  const rows = table.getRowModel().rows;
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
    </div>
  );
}
