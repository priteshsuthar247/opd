"use client";

import { useMemo, useState } from "react";
import {
  createColumnHelper,
  useTable,
} from "@tanstack/react-table";
import {
  categoryTypeFacet,
  ExpandedActions,
  ExpandedList,
  expandColumn,
  filterIncludesAny,
  makeStatusToggle,
  RowActions,
  secondaryColumnClass,
  selectionColumn,
  sortHeader,
  statusFacet,
  statusRowItems,
  tableFeaturesFull,
} from "@/components/table/table-helpers";
import { DataTable } from "@/components/table/data-table";
import { TableEmpty } from "@/components/ui/table-empty";
import { ActiveBadge } from "@/components/ui/active-badge";
import { CategoryDialog } from "@/components/admin/category-dialog";
import type { CategoryRow } from "@/db/queries/categories";
import { setCategoryStatus } from "@/app/admin/categories/actions";

const features = tableFeaturesFull;
const helper = createColumnHelper<typeof features, CategoryRow>();

const typeLabels = {
  diagnosis: "Diagnosis",
  symptom: "Symptom",
  complaint: "Complaint",
} as const;

const toggleStatus = makeStatusToggle(setCategoryStatus, "Category");

// One item list drives both the ellipsis menu and the expanded panel.
function categoryMenu(row: CategoryRow, onEdit: (row: CategoryRow) => void) {
  return statusRowItems(row, {
    onEdit: () => onEdit(row),
    onToggle: toggleStatus,
    name: row.name,
    noun: "Category",
    deactivateHint:
      "Past records keep it, but it can no longer be picked going forward.",
  });
}

const columns = (onEdit: (row: CategoryRow) => void) =>
  helper.columns([
  selectionColumn<CategoryRow>(),
  helper.accessor("name", {
    header: sortHeader("Name"),
    cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
  }),
  helper.accessor("type", {
    header: sortHeader("Type"),
    filterFn: filterIncludesAny,
    cell: ({ getValue }) => typeLabels[getValue()],
    meta: { className: secondaryColumnClass },
  }),
  helper.accessor("status", {
    header: sortHeader("Status"),
    filterFn: filterIncludesAny,
    cell: ({ getValue }) => <ActiveBadge status={String(getValue())} />,
    meta: { className: secondaryColumnClass },
  }),
  helper.display({
    id: "actions",
    header: "",
    enableHiding: false,
    meta: { className: secondaryColumnClass },
    cell: ({ row }) => (
      <div className="flex justify-end">
        <RowActions items={categoryMenu(row.original, onEdit)} />
      </div>
    ),
  }),
  expandColumn<CategoryRow>(),
]);

export function CategoriesTable({ data }: { data: CategoryRow[] }) {
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const table = useTable({
    features,
    columns: useMemo(() => columns(setEditing), []),
    data,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });

  if (data.length === 0) {
    return (
      <TableEmpty
        message="No categories yet. Add the first one for clinical coding."
        action={<CategoryDialog />}
      />
    );
  }

  return (
    <>
      <DataTable
        table={table}
        total={data.length}
        searchPlaceholder="Search categories…"
        facets={[categoryTypeFacet, statusFacet]}
        exportFilename="categories"
        empty="No categories match these filters."
        renderExpanded={(row) => (
          <div className="flex flex-col gap-2">
            <ExpandedList
              items={[
                { label: "Status", value: <ActiveBadge status={row.status} /> },
                { label: "Type", value: typeLabels[row.type] },
              ]}
            />
            <ExpandedActions items={categoryMenu(row, setEditing)} />
          </div>
        )}
      />
      {editing && (
        <CategoryDialog
          category={editing}
          open
          onOpenChange={(v) => {
            if (!v) setEditing(null);
          }}
        />
      )}
    </>
  );
}
