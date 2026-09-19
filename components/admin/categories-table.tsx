"use client";

import { useMemo, useState } from "react";
import {
  createColumnHelper,
  useTable,
} from "@tanstack/react-table";
import {
  categoryTypeFacet,
  filterIncludesAny,
  makeStatusToggle,
  RowActions,
  selectionColumn,
  sortHeader,
  statusFacet,
  statusRowItems,
  tableFeaturesFull,
} from "@/components/table/table-helpers";
import { DataTable } from "@/components/table/data-table";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  }),
  helper.accessor("status", {
    header: sortHeader("Status"),
    filterFn: filterIncludesAny,
    cell: ({ getValue }) =>
      getValue() === "active" ? (
        <Badge variant="secondary">
          <Check className="size-3" /> Active
        </Badge>
      ) : (
        <Badge variant="outline">Inactive</Badge>
      ),
  }),
  helper.display({
    id: "actions",
    header: "",
    enableHiding: false,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <RowActions
          items={statusRowItems(row.original, {
            onEdit: () => onEdit(row.original),
            onToggle: toggleStatus,
            name: row.original.name,
            noun: "Category",
            deactivateHint:
              "Past records keep it, but it can no longer be picked going forward.",
          })}
        />
      </div>
    ),
  }),
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
      <div className="flex flex-col items-center gap-3 rounded-md border py-12 text-center">
        <p className="text-sm text-muted-foreground">
          No categories yet. Add the first one for clinical coding.
        </p>
        <CategoryDialog />
      </div>
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
