"use client";

import { useEffect, useMemo, useState } from "react";
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
import { TableEmpty } from "@/components/ui/table-empty";
import { ActiveBadge } from "@/components/ui/active-badge";
import { PatientDialog } from "@/components/reception/patient-dialog";
import type { PatientRow } from "@/db/queries/patients";
import { setPatientStatus } from "@/app/reception/patients/actions";

const features = tableFeaturesFull;
const helper = createColumnHelper<typeof features, PatientRow>();

function ageOn(dob: string | null): string {
  if (!dob) return "—";
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return "—";
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age < 0 ? "—" : String(age);
}

const toggleStatus = makeStatusToggle(setPatientStatus, "Patient");

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
        <RowActions
          items={statusRowItems(row.original, {
            onEdit: () => onEdit(row.original),
            onToggle: toggleStatus,
            name: row.original.name,
            noun: "Patient",
            deactivateHint:
              "Their history stays, but no new appointments can be booked for them.",
          })}
        />
      </div>
    ),
  }),
]);

export function PatientsTable({ data }: { data: PatientRow[] }) {
  // "/" focuses the toolbar search from anywhere on the page (unless
  // already typing).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      const typing =
        el !== null &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.tagName === "SELECT" ||
          el.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        document.getElementById("table-search")?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
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
