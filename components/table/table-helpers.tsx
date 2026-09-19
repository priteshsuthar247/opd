"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import {
  columnFacetingFeature,
  columnFilteringFeature,
  columnVisibilityFeature,
  createColumnHelper,
  createExpandedRowModel,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  globalFilteringFeature,
  rowPaginationFeature,
  rowExpandingFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
  type RowData,
} from "@tanstack/react-table";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ChevronsUpDownIcon,
  EllipsisVerticalIcon,
  EyeOffIcon,
  PlusCircleIcon,
  XIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/ui/form-select";
import { Separator } from "@/components/ui/separator";

// One feature set for every table in the app: sorting, pagination,
// global text search, faceted column filters and column visibility.
export const tableFeaturesFull = tableFeatures({  rowSortingFeature,
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
  rowSelectionFeature,
  rowExpandingFeature,
  expandedRowModel: createExpandedRowModel(),
});

export const defaultPageSize = 10;

// Non-essential columns carry this via columnDef meta: visible on
// desktop, hidden on small screens where the expanded panel shows them.
// Applies to secondary data columns plus the select/actions chrome, so a
// mobile row is identity + chevron only.
export const secondaryColumnClass = "hidden md:table-cell";

// Structural sort API: the real Column type composes these methods in via
// the sorting feature, which generic code can't name — but every table
// built on tableFeaturesFull carries them, verified by tsc at each site.
export type SortableColumn = {
  getCanSort: () => boolean;
  getIsSorted: () => false | "asc" | "desc";
  getToggleSortingHandler: () => ((event: unknown) => void) | undefined;
  toggleSorting: (desc?: boolean) => void;
  clearSorting: () => void;
  toggleVisibility: (visible: boolean) => void;
};

function SortButton({ column, label }: { column: SortableColumn; label: string }) {
  // tablecn-style header: sort dropdown (asc/desc) plus hide column.
  const toggle = column.getCanSort() ? column.getToggleSortingHandler() : undefined;
  if (!toggle) return <span>{label}</span>;
  const dir = column.getIsSorted();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="sm" className="-ml-2">
            {label}
            {dir === "asc" ? (
              <ArrowUpIcon className="size-3" />
            ) : dir === "desc" ? (
              <ArrowDownIcon className="size-3" />
            ) : (
              <ChevronsUpDownIcon className="size-3 text-muted-foreground" />
            )}
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="w-36">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
            <ArrowUpIcon />
            Asc
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
            <ArrowDownIcon />
            Desc
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
            <EyeOffIcon />
            Hide
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
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
  setPageIndex: (index: number) => void;
  setPageSize: (size: number) => void;
  state: { pagination: { pageIndex: number; pageSize: number }; globalFilter?: unknown };
};
export function TablePagination({
  table,
  total,
  pageSizeOptions = [10, 20, 30, 50],
}: {
  table: PaginatedTable;
  total: number;
  pageSizeOptions?: number[];
}) {
  const current = table.state.pagination.pageIndex + 1;
  const pages = table.getPageCount();
  return (
    <div className="flex w-full flex-col-reverse items-center justify-between gap-4 overflow-auto py-2 sm:flex-row sm:gap-8">
      <div className="flex-1 text-xs whitespace-nowrap text-muted-foreground">
        {total} row{total === 1 ? "" : "s"} total
      </div>
      <div className="flex flex-col-reverse items-center gap-4 sm:flex-row sm:gap-6">
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium whitespace-nowrap">Rows per page</p>
          <FormSelect
            value={String(table.state.pagination.pageSize)}
            onValueChange={(v) => table.setPageSize(Number(v))}
            options={pageSizeOptions.map((s) => ({
              value: String(s),
              label: String(s),
            }))}
          />
        </div>
        <div className="flex items-center justify-center text-xs font-medium">
          Page {current} of {Math.max(pages, 1)}
        </div>
        <div className="flex items-center gap-1">
          <Button
            aria-label="Go to first page"
            variant="outline"
            size="icon-sm"
            className="hidden lg:inline-flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeftIcon />
          </Button>
          <Button
            aria-label="Go to previous page"
            variant="outline"
            size="icon-sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            aria-label="Go to next page"
            variant="outline"
            size="icon-sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRightIcon />
          </Button>
          <Button
            aria-label="Go to last page"
            variant="outline"
            size="icon-sm"
            className="hidden lg:inline-flex"
            onClick={() => table.setPageIndex(Math.max(table.getPageCount() - 1, 0))}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRightIcon />
          </Button>
        </div>
      </div>
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

// Leading select column factory (tablecn-style row selection). One line
// per table: selectionColumn<Row>() first in helper.columns([...]).
// Kept out of DataTable itself because columns must exist before useTable.
export function selectionColumn<TData extends RowData>() {
  const helper = createColumnHelper<typeof tableFeaturesFull, TData>();
  return helper.display({
    id: "select",
    header: ({ table }) => {
      const all = table.getIsAllRowsSelected();
      const some =
        !all && table.getSelectedRowModel().rows.length > 0;
      return (
        <Checkbox
          checked={all}
          indeterminate={some}
          onCheckedChange={(v) => table.toggleAllRowsSelected(v === true)}
          aria-label="Select all rows"
        />
      );
    },
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(v) => row.toggleSelected(v === true)}
        aria-label="Select row"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
    meta: { className: secondaryColumnClass },
  });
}

// Expander column: chevron button as the last column of a table. Toggles
// the expanded detail panel rendered by DataTable (via renderExpanded).
// Placed last so essentials stay left, matching the mobile-first layout.
export function expandColumn<TData extends RowData>() {
  const helper = createColumnHelper<typeof tableFeaturesFull, TData>();
  return helper.display({
    id: "expand",
    header: () => null,
    cell: ({ row }) => {
      const expanded = row.getIsExpanded();
      return (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={row.getToggleExpandedHandler()}
          aria-label={expanded ? "Collapse row" : "Expand row"}
          aria-expanded={expanded}
        >
          {expanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
        </Button>
      );
    },
    enableSorting: false,
    enableHiding: false,
  });
}

// Label/value list rendered inside an expanded row panel. Keeps detail
// markup uniform across all nine tables — no per-table panel styling.
export type ExpandedItem = {
  label: string;
  value: ReactNode;
};

export function ExpandedList({ items }: { items: ExpandedItem[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 px-1 py-1 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-muted-foreground text-xs">{item.label}</dt>
          <dd className="truncate text-sm">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

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

export type RowAction = {
  label: string;
  destructive?: boolean;
  onSelect: () => void | Promise<void>;
  confirm?: { title: string; description: string; confirmLabel: string };
};

// Expanded-panel twin of RowActions: renders the SAME action items as
// small buttons, so the panel carries every action the row menu has.
// Confirm-backed items get their own dialog each — no shared state.
export function ExpandedActions({ items }: { items: RowAction[] }) {
  const [pending, setPending] = useState<RowAction | null>(null);

  return (
    <>
      <div className="flex flex-wrap gap-2 px-1 pt-1">
        {items.map((item) => (
          <Button
            key={item.label}
            size="sm"
            variant={item.destructive ? "destructive" : "outline"}
            onClick={() => {
              if (item.confirm) setPending(item);
              else void item.onSelect();
            }}
          >
            {item.label}
          </Button>
        ))}
      </div>
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(v) => !v && setPending(null)}
        title={pending?.confirm?.title ?? ""}
        description={pending?.confirm?.description ?? ""}
        confirmLabel={pending?.confirm?.confirmLabel}
        onConfirm={async () => {
          if (!pending) return;
          await pending.onSelect();
          setPending(null);
        }}
      />
    </>
  );
}

// Sigil-style row menu: one ellipsis trigger per row instead of a column
// of buttons. Destructive items confirm inline through an alert dialog,
// so tables never nest dialog triggers inside menu items.
export function RowActions({ items }: { items: RowAction[] }) {
  const [pending, setPending] = useState<RowAction | null>(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground"
            />
          }
        >
          <EllipsisVerticalIcon />
          <span className="sr-only">Open row menu</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuGroup>
            {items.map((item) => (
              <DropdownMenuItem
                key={item.label}
                variant={item.destructive ? "destructive" : "default"}
                onClick={() => {
                  if (item.confirm) setPending(item);
                  else void item.onSelect();
                }}
              >
                {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(v) => !v && setPending(null)}
        title={pending?.confirm?.title ?? ""}
        description={pending?.confirm?.description ?? ""}
        confirmLabel={pending?.confirm?.confirmLabel}
        onConfirm={async () => {
          if (!pending) return;
          await pending.onSelect();
          setPending(null);
        }}
      />
    </>
  );
}

export type StatusActionResult = { ok: true } | { ok: false; error: string };

// One status-flip for every master table: was 9 copy-pasted toggleStatus
// functions differing only in action and noun.
export function makeStatusToggle<T extends { id: number; status: string }>(
  action: (input: {
    id: number;
    status: "active" | "inactive";
  }) => Promise<StatusActionResult>,
  noun: string
) {
  return async (row: T): Promise<void> => {
    const next = row.status === "active" ? "inactive" : "active";
    const result = await action({ id: row.id, status: next });
    if (!result.ok) toast.error(result.error);
    else toast.success(`${noun} ${next === "active" ? "activated" : "deactivated"}.`);
  };
}

// The Edit + Activate/Deactivate row menu shared by every master table.
export function statusRowItems<T extends { id: number; status: string }>(
  row: T,
  opts: {
    onEdit: () => void;
    onToggle: (row: T) => void;
    name: string;
    noun: string;
    deactivateHint: string;
  }
): RowAction[] {
  return [
    { label: "Edit", onSelect: opts.onEdit },
    row.status === "active"
      ? {
          label: "Deactivate",
          destructive: true,
          onSelect: () => opts.onToggle(row),
          confirm: {
            title: `Deactivate ${opts.name}?`,
            description: opts.deactivateHint,
            confirmLabel: "Deactivate",
          },
        }
      : {
          label: "Activate",
          onSelect: () => opts.onToggle(row),
        },
  ];
}
