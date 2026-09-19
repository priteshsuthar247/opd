"use client";

import { useMemo, useState } from "react";
import {
  createColumnHelper,
  useTable,
} from "@tanstack/react-table";
import {
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
import { DoctorDialog } from "@/components/admin/doctor-dialog";
import type { DoctorRow } from "@/db/queries/doctors";
import { setDoctorStatus } from "@/app/admin/doctors/actions";

const features = tableFeaturesFull;
const helper = createColumnHelper<typeof features, DoctorRow>();

const toggleStatus = makeStatusToggle(setDoctorStatus, "Doctor");

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
          items={statusRowItems(row.original, {
            onEdit: () => onEdit(row.original),
            onToggle: toggleStatus,
            name: row.original.user.name,
            noun: "Doctor",
            deactivateHint:
              "Their queue and history stay, but no new appointments can be booked with them.",
          })}
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
