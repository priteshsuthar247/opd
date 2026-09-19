"use client";

import { useState } from "react";
import {
  createColumnHelper,
  useTable,
} from "@tanstack/react-table";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  filterIncludesAny,
  RowActions,
  selectionColumn,
  sortHeader,
  statusFacet,
  tableFeaturesFull,
} from "@/components/table/table-helpers";
import { DataTable } from "@/components/table/data-table";
import { DepartmentDialog } from "@/components/admin/department-dialog";
import type { DepartmentRow } from "@/db/queries/departments";
import { setDepartmentStatus } from "@/app/admin/departments/actions";

const features = tableFeaturesFull;
const helper = createColumnHelper<typeof features, DepartmentRow>();

async function toggleStatus(row: DepartmentRow) {
  const next = row.status === "active" ? "inactive" : "active";
  const result = await setDepartmentStatus({ id: row.id, status: next });
  if (!result.ok) toast.error(result.error);
  else
    toast.success(
      next === "active" ? "Department activated." : "Department deactivated."
    );
}

const columns = (onEdit: (row: DepartmentRow) => void) =>
  helper.columns([
    selectionColumn<DepartmentRow>(),
    helper.accessor("name", {
      header: sortHeader("Name"),
      cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
    }),
    helper.accessor("code", { header: sortHeader("Code") }),
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
                        "Doctors in this department stay untouched, but it can no longer be picked for new doctors.",
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

export function DepartmentsTable({ data }: { data: DepartmentRow[] }) {
  const [editing, setEditing] = useState<DepartmentRow | null>(null);
  const table = useTable({
    features,
    columns: columns(setEditing),
    data,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-md border py-12 text-center">
        <p className="text-sm text-muted-foreground">
          No departments yet. Add the first one to start organizing doctors.
        </p>
        <DepartmentDialog />
      </div>
    );
  }

  return (
    <>
      <DataTable
        table={table}
        total={data.length}
        searchPlaceholder="Search departments…"
        facets={[statusFacet]}
        empty="No departments match these filters."
        exportFilename="departments"
      />
      {editing && (
        <DepartmentDialog
          department={editing}
          open
          onOpenChange={(v) => {
            if (!v) setEditing(null);
          }}
        />
      )}
    </>
  );
}
