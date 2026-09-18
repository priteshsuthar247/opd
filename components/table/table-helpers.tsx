"use client";

import {
  columnFacetingFeature,
  columnFilteringFeature,
  columnVisibilityFeature,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
} from "@tanstack/react-table";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
  PlusCircleIcon,
  XIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

// One feature set for every table in the app: sorting, pagination,
// global text search, faceted column filters and column visibility.
export const tableFeaturesFull = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
  columnFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  columnVisibilityFeature,
  columnFacetingFeature,
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  globalFilteringFeature,
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
  state: { pagination: { pageIndex: number }; globalFilter?: unknown };
};

export function TablePagination({
  table,
  total,
}: {
  table: PaginatedTable;
  total: number;
}) {  const pages = table.getPageCount();
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

export const statusFacet: FacetFilter = {
  columnId: "status",
  title: "Status",
  options: [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ],
};

export const queueStatusFacet: FacetFilter = {
  columnId: "status",
  title: "Status",
  options: [
    { value: "waiting", label: "Waiting" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
    { value: "no_show", label: "No-show" },
  ],
};

export const appointmentTypeFacet: FacetFilter = {
  columnId: "type",
  title: "Type",
  options: [
    { value: "walk_in", label: "Walk-in" },
    { value: "scheduled", label: "Scheduled" },
  ],
};

export const categoryTypeFacet: FacetFilter = {
  columnId: "type",
  title: "Type",
  options: [
    { value: "diagnosis", label: "Diagnosis" },
    { value: "symptom", label: "Symptom" },
    { value: "complaint", label: "Complaint" },
  ],
};

// Matches rows whose column value is any of the selected facet values.
// Used for multi-select status/type filters (tablecn-style faceting).
export function filterIncludesAny(
  row: { getValue: (columnId: string) => unknown },
  columnId: string,
  filterValue: unknown
): boolean {
  if (!Array.isArray(filterValue) || filterValue.length === 0) return true;
  return filterValue.includes(row.getValue(columnId));
}

export type FacetOption = { value: string; label: string };
export type FacetFilter = {
  columnId: string;
  title: string;
  options: FacetOption[];
};

export type FilterColumn = {
  id: string;
  getFilterValue: () => unknown;
  setFilterValue: (value: unknown) => void;
  getFacetedUniqueValues: () => Map<string, number>;
};

export type VisibilityColumn = {
  id: string;
  getCanHide: () => boolean;
  getIsVisible: () => boolean;
  toggleVisibility: (visible: boolean) => void;
  columnDef: { header?: unknown };
};

export type FilterableTable = {
  getColumn: (id: string) => FilterColumn | undefined;
  getAllColumns: () => VisibilityColumn[];
  resetColumnFilters: () => void;
  setGlobalFilter: (value: string) => void;
  state: { globalFilter?: unknown };
};

function FacetFilterMenu({
  column,
  title,
  options,
}: {
  column: FilterColumn;
  title: string;
  options: FacetOption[];
}) {
  const selected = new Set(
    Array.isArray(column.getFilterValue())
      ? (column.getFilterValue() as string[])
      : []
  );
  const counts = column.getFacetedUniqueValues();

  function toggle(value: string) {
    const next = new Set(selected);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    column.setFilterValue(next.size === 0 ? undefined : [...next]);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm">
            <PlusCircleIcon />
            {title}
            {selected.size > 0 && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <Badge variant="secondary" className="px-1">
                  {selected.size}
                </Badge>
              </>
            )}
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuGroup>
          {options.map((o) => {
            const checked = selected.has(o.value);
            return (
              <DropdownMenuCheckboxItem
                key={o.value}
                checked={checked}
                onCheckedChange={() => toggle(o.value)}
                onSelect={(e) => e.preventDefault()}
              >
                {o.label}
                <span className="ml-auto text-xs text-muted-foreground">
                  {counts.get(o.value) ?? 0}
                </span>
              </DropdownMenuCheckboxItem>
            );
          })}
        </DropdownMenuGroup>
        {selected.size > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItemClear
                onClear={() => column.setFilterValue(undefined)}
              />
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DropdownMenuItemClear({ onClear }: { onClear: () => void }) {
  return (
    <button
      type="button"
      onClick={onClear}
      className="flex w-full items-center justify-center px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
    >
      Clear filter
    </button>
  );
}

function ViewOptions({ table }: { table: FilterableTable }) {
  const hideable = table.getAllColumns().filter((c) => c.getCanHide());
  if (hideable.length === 0) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm">
            Columns
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Show columns</DropdownMenuLabel>
          {hideable.map((c) => (
            <DropdownMenuCheckboxItem
              key={c.id}
              checked={c.getIsVisible()}
              onCheckedChange={(v) => c.toggleVisibility(v === true)}
              onSelect={(e) => e.preventDefault()}
            >
              {typeof c.columnDef.header === "string"
                ? c.columnDef.header
                : c.id}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// tablecn-style toolbar: global text search, faceted multi-select
// filters with live counts, reset, and column visibility.
export function DataTableToolbar({
  table,
  searchPlaceholder = "Search…",
  facets = [],
}: {
  table: FilterableTable;
  searchPlaceholder?: string;
  facets?: FacetFilter[];
}) {
  const globalFilter = (table.state.globalFilter as string | undefined) ?? "";
  const activeFacets = facets.filter((f) => {
    const col = table.getColumn(f.columnId);
    const v = col?.getFilterValue();
    return Array.isArray(v) && v.length > 0;
  });
  const isFiltered = globalFilter !== "" || activeFacets.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        id="table-search"
        placeholder={searchPlaceholder}
        value={globalFilter}
        onChange={(e) => table.setGlobalFilter(e.target.value)}
        className="max-w-xs"
      />
      {facets.map((f) => {
        const col = table.getColumn(f.columnId);
        if (!col) return null;
        return (
          <FacetFilterMenu
            key={f.columnId}
            column={col}
            title={f.title}
            options={f.options}
          />
        );
      })}
      {isFiltered && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            table.resetColumnFilters();
            table.setGlobalFilter("");
          }}
        >
          <XIcon />
          Reset
        </Button>
      )}
      <span className="ml-auto">
        <ViewOptions table={table} />
      </span>
    </div>
  );
}
