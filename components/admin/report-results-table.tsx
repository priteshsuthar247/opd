"use client";

import { useMemo } from "react";
import {
  createColumnHelper,
  useTable,
} from "@tanstack/react-table";
import {
  ExpandedList,
  filterIncludesAny,
  queueStatusFacet,
  sortHeader,
  tableFeaturesFull,
} from "@/components/table/table-helpers";
import { DataTable } from "@/components/table/data-table";
import { StatusBadge } from "@/components/queue/status-badge";
import type { listAppointmentsInRange } from "@/db/queries/reports";

type ReportRow = Awaited<ReturnType<typeof listAppointmentsInRange>>[number];

const features = tableFeaturesFull;
const helper = createColumnHelper<typeof features, ReportRow>();

const columns = helper.columns([
  helper.accessor("date", { header: sortHeader("Date") }),
  helper.accessor("tokenNumber", { header: sortHeader("Token") }),
  helper.accessor((r) => r.patient.name, {
    id: "patient",
    header: sortHeader("Patient"),
    cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
  }),
  helper.accessor((r) => r.doctor.user.name, {
    id: "doctor",
    header: sortHeader("Doctor"),
  }),
  helper.accessor("status", {
    header: sortHeader("Status"),
    filterFn: filterIncludesAny,
    cell: ({ getValue }) => <StatusBadge status={getValue()} />,
  }),
  helper.accessor((r) => r.consultation?.diagnosis ?? "—", {
    id: "diagnosis",
    header: "Diagnosis",
  }),
]);

// Read-only result grid for the custom report: search, status facet,
// pagination, and mobile cards with a detail sheet — the hand-rolled
// table had none of these. Filtering stays server-side via URL params;
// the toolbar search narrows within the loaded range.
export function ReportResultsTable({ data }: { data: ReportRow[] }) {
  const table = useTable({
    features,
    columns: useMemo(() => columns, []),
    data,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });

  return (
    <DataTable
      table={table}
      total={data.length}
      searchPlaceholder="Search patient or doctor…"
      facets={[queueStatusFacet]}
      empty="No visits match these filters."
      mobileTitle={(row) => `${row.date} · ${row.patient.name}`}
      mobileSummary={(row) => (
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <StatusBadge status={row.status} />
          {row.doctor.user.name}
        </span>
      )}
      renderExpanded={(row) => (
        <ExpandedList
          items={[
            { label: "Phone", value: row.patient.phone },
            { label: "Department", value: row.doctor.department.name },
            {
              label: "Type",
              value: row.type === "walk_in" ? "Walk-in" : "Scheduled",
            },
          ]}
        />
      )}
    />
  );
}
