"use client";

import { useMemo, useState } from "react";
import {
  createColumnHelper,
  useTable,
} from "@tanstack/react-table";
import {
  categoryTypeFacet,
  filterIncludesAny,
  RowActions,
  selectionColumn,
  sortHeader,
  statusFacet,
  tableFeaturesFull,
} from "@/components/table/table-helpers";
import { DataTable } from "@/components/table/data-table";
import { Check } from "lucide-react";
import { toast } from "sonner";
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

async function toggleStatus(row: CategoryRow) {
  const next = row.status === "active" ? "inactive" : "active";
  const result = await setCategoryStatus({ id: row.id, status: next });
  if (!result.ok) toast.error(result.error);
  else
    toast.success(
      next === "active" ? "Category activated." : "Category deactivated."
    );
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
          items={[
            { label: "Edit", onSelect: () => onEdit(row.original) },
            row.original.status === "active"
              ? {
                  label: "Deactivate",
                  destructive: true,
                  onSelect: () => toggleStatus(row.original),
                  confirm: {
                    title: `Deactivate ${row.original.name}?`,
                    description:
                      "Past records keep it, but it can no longer be picked going forward.",
                    confirmLabel: "Deactivate",
                  },
                }
              : {
                  label: "Activate",
                  onSelect: () => toggleStatus(row.original),
                },
          ]}
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
