"use client";

import { useMemo, useState } from "react";
import {
  createColumnHelper,
  useTable,
} from "@tanstack/react-table";
import {
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
import { DoctorDialog } from "@/components/admin/doctor-dialog";
import type { DoctorRow } from "@/db/queries/doctors";
import { setDoctorStatus } from "@/app/admin/doctors/actions";

const features = tableFeaturesFull;
const helper = createColumnHelper<typeof features, DoctorRow>();

async function toggleStatus(row: DoctorRow) {
  const next = row.status === "active" ? "inactive" : "active";
  const result = await setDoctorStatus({ id: row.id, status: next });
  if (!result.ok) toast.error(result.error);
  else
    toast.success(
      next === "active" ? "Doctor activated." : "Doctor deactivated."
    );
}

const columns = (
  departments: { id: number; name: string }[],
  onEdit: (row: DoctorRow) => void
) =>
  helper.columns([
  selectionColumn<DoctorRow>(),
  helper.accessor((r) => r.user.name, {
    id: "name",
    header: sortHeader("Doctor"),
    cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
  }),
  helper.accessor((r) => r.department.name, {
    id: "department",
    header: sortHeader("Department"),
  }),
  helper.accessor("qualification", { header: sortHeader("Qualification") }),
  helper.accessor("consultationFee", {
    header: sortHeader("Fee (₹)"),
    cell: ({ getValue }) => Number(getValue()).toFixed(2),
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
                    title: `Deactivate ${row.original.user.name}?`,
                    description:
                      "Their queue and history stay, but no new appointments can be booked with them.",
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

export function DoctorsTable({
  data,
  departments,
}: {
  data: DoctorRow[];
  departments: { id: number; name: string }[];
}) {
  const [editing, setEditing] = useState<DoctorRow | null>(null);
  const table = useTable({
    features,
    columns: useMemo(() => columns(departments, setEditing), [departments]),
    data,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-md border py-12 text-center">
        <p className="text-sm text-muted-foreground">
          No doctors yet. Add the first one with login, profile and hours.
        </p>
        <DoctorDialog departments={departments} />
      </div>
    );
  }

  return (
    <>
      <DataTable
        table={table}
        total={data.length}
        searchPlaceholder="Search doctors…"
        facets={[statusFacet]}
        exportFilename="doctors"
        empty="No doctors match these filters."
      />
      {editing && (
        <DoctorDialog
          doctor={editing}
          departments={departments}
          open
          onOpenChange={(v) => {
            if (!v) setEditing(null);
          }}
        />
      )}
    </>
  );
}
