"use client";

import { useMemo, useState } from "react";
import {
  createColumnHelper,
  useTable,
} from "@tanstack/react-table";
import {
  ExpandedActions,
  ExpandedList,
  filterIncludesAny,
  makeStatusToggle,
  RowActions,
  selectionColumn,
  sortHeader,
  statusFacet,
  statusRowItems,
  tableFeaturesFull,
} from "@/components/table/table-helpers";
import { ageOn } from "@/lib/dates";
import { DataTable } from "@/components/table/data-table";
import { TableEmpty } from "@/components/ui/table-empty";
import { ActiveBadge } from "@/components/ui/active-badge";
import { PatientDialog } from "@/components/reception/patient-dialog";
import type { PatientRow } from "@/db/queries/patients";
import { setPatientStatus } from "@/app/reception/patients/actions";

const features = tableFeaturesFull;
const helper = createColumnHelper<typeof features, PatientRow>();

const toggleStatus = makeStatusToggle(setPatientStatus, "Patient");

// One item list drives both the ellipsis menu and the expanded panel.
function patientMenu(row: PatientRow, onEdit: (row: PatientRow) => void) {
  return statusRowItems(row, {
    onEdit: () => onEdit(row),
    onToggle: toggleStatus,
    name: row.name,
    noun: "Patient",
    deactivateHint:
      "Their history stays, but no new appointments can be booked for them.",
  });
}

const columns = (onEdit: (row: PatientRow) => void) =>
  helper.columns([
  selectionColumn<PatientRow>(),
  helper.accessor("name", {
    header: sortHeader("Name"),
    cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
  }),
  helper.accessor("phone", { header: sortHeader("Phone") }),
  helper.display({
    id: "age",
    header: "Age",
    cell: ({ row }) => ageOn(row.original.dob),
  }),
  helper.accessor("gender", {
    header: sortHeader("Gender"),
    cell: ({ getValue }) => getValue() ?? "—",
  }),
  helper.accessor("status", {
    header: sortHeader("Status"),
    filterFn: filterIncludesAny,
    cell: ({ getValue }) => <ActiveBadge status={String(getValue())} />,
  }),
  helper.display({
    id: "actions",
    header: "",
    enableHiding: false,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <RowActions items={patientMenu(row.original, onEdit)} />
      </div>
    ),
  }),
]);

export function PatientsTable({ data }: { data: PatientRow[] }) {
  const [editing, setEditing] = useState<PatientRow | null>(null);
  const table = useTable({
    features,
    columns: useMemo(() => columns(setEditing), []),
    data,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });

  return (
    <div className="flex flex-col gap-3">
      {data.length === 0 ? (
        <TableEmpty
          message="No patients registered yet."
          action={<PatientDialog />}
        />
      ) : (
        <>
          <DataTable
            table={table}
            total={data.length}
            searchPlaceholder="Search by name or phone…"
            facets={[statusFacet]}
            exportFilename="patients"
            empty="No patients match this search."
            mobileTitle={(row) => row.name}
            mobileSummary={(row) => (
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <ActiveBadge status={row.status} />
                {row.phone}
              </span>
            )}
            renderExpanded={(row) => (
              <div className="flex flex-col gap-2">
                <ExpandedList
                  items={[
                    { label: "Status", value: <ActiveBadge status={row.status} /> },
                    { label: "Age", value: ageOn(row.dob) },
                    { label: "Gender", value: row.gender ?? "—" },
                    { label: "Blood group", value: row.bloodGroup ?? "—" },
                    { label: "Address", value: row.address ?? "—" },
                    {
                      label: "Emergency contact",
                      value: row.emergencyContact ?? "—",
                    },
                  ]}
                />
                <ExpandedActions
                  items={patientMenu(row, setEditing)}
                />
              </div>
            )}
          />
          {editing && (
            <PatientDialog
              patient={editing}
              open
              onOpenChange={(v) => {
                if (!v) setEditing(null);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
