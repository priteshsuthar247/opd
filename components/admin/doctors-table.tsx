"use client";

import { useMemo, useState } from "react";
import {
  createColumnHelper,
  useTable,
} from "@tanstack/react-table";
import {
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
import { DoctorDialog } from "@/components/admin/doctor-dialog";
import type { DoctorRow } from "@/db/queries/doctors";
import { setDoctorStatus } from "@/app/admin/doctors/actions";

const features = tableFeaturesFull;
const helper = createColumnHelper<typeof features, DoctorRow>();

const toggleStatus = makeStatusToggle(setDoctorStatus, "Doctor");

// One item list drives both the ellipsis menu and the expanded panel.
function doctorMenu(row: DoctorRow, onEdit: (row: DoctorRow) => void) {
  return statusRowItems(row, {
    onEdit: () => onEdit(row),
    onToggle: toggleStatus,
    name: row.user.name,
    noun: "Doctor",
    deactivateHint:
      "Their queue and history stay, but no new appointments can be booked with them.",
  });
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
  helper.accessor("qualification", {
    header: sortHeader("Qualification"),
    meta: { className: secondaryColumnClass },
  }),
  helper.accessor("consultationFee", {
    header: sortHeader("Fee (₹)"),
    cell: ({ getValue }) => Number(getValue()).toFixed(2),
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
        <RowActions items={doctorMenu(row.original, onEdit)} />
      </div>
    ),
  }),
  expandColumn<DoctorRow>(),
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
      <TableEmpty
        message="No doctors yet. Add the first one with login, profile and hours."
        action={<DoctorDialog departments={departments} />}
      />
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
        mobileTitle={(row) => row.user.name}
        mobileSummary={(row) => (
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <ActiveBadge status={row.status} />
            {row.department.name}
          </span>
        )}
        renderExpanded={(row) => (
          <div className="flex flex-col gap-2">
            <ExpandedList
              items={[
                { label: "Status", value: <ActiveBadge status={row.status} /> },
                { label: "Qualification", value: row.qualification },
                {
                  label: "Fee (₹)",
                  value: Number(row.consultationFee).toFixed(2),
                },
              ]}
            />
            <ExpandedActions items={doctorMenu(row, setEditing)} />
          </div>
        )}
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
