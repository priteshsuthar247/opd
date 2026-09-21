"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  createColumnHelper,
  useTable,
} from "@tanstack/react-table";
import {
  ExpandedList,
  filterIncludesAny,
  sortHeader,
  statusFacet,
  tableFeaturesFull,
} from "@/components/table/table-helpers";
import { DataTable } from "@/components/table/data-table";
import { TableEmpty } from "@/components/ui/table-empty";
import { ActiveBadge } from "@/components/ui/active-badge";
import { Button } from "@/components/ui/button";
import { ageOn } from "@/lib/dates";
import type { PatientRow } from "@/db/queries/patients";

const features = tableFeaturesFull;
const helper = createColumnHelper<typeof features, PatientRow>();

const columns = (onView: (row: PatientRow) => void) =>
  helper.columns([
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
    helper.display({
      id: "actions",
      header: "",
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(row.original)}
          >
            View
          </Button>
        </div>
      ),
    }),
  ]);

// Read-only patient browser for the visit report: no selection column,
// no ellipsis menu, no edit dialogs — rows navigate to ?patientId=<id>.
// Search, sort, pagination, and mobile cards come from DataTable.
export function PatientPickerTable({ data }: { data: PatientRow[] }) {
  const router = useRouter();

  function onView(row: PatientRow) {
    router.push(`/admin/reports/patient-visit?patientId=${row.id}`);
  }

  const table = useTable({
    features,
    columns: useMemo(() => columns(onView), []),
    data,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });

  if (data.length === 0) {
    return (
      <TableEmpty message="No patients registered yet." action={null} />
    );
  }

  return (
    <DataTable
      table={table}
      total={data.length}
      searchPlaceholder="Search by name or phone…"
      facets={[statusFacet]}
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
              { label: "Age", value: ageOn(row.dob) },
              { label: "Gender", value: row.gender ?? "—" },
            ]}
          />
          <div className="flex px-1 pt-1">
            <Button size="sm" variant="outline" onClick={() => onView(row)}>
              View visits
            </Button>
          </div>
        </div>
      )}
    />
  );
}
