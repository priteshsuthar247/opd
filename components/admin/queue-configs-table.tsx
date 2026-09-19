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
import { TableEmpty } from "@/components/ui/table-empty";
import { ActiveBadge } from "@/components/ui/active-badge";
import { QueueConfigDialog } from "@/components/admin/queue-config-dialog";
import type { QueueConfigRow } from "@/db/queries/queue-configs";
import { setQueueConfigStatus } from "@/app/admin/queue/actions";

const features = tableFeaturesFull;
const helper = createColumnHelper<typeof features, QueueConfigRow>();

const toggleStatus = makeStatusToggle(setQueueConfigStatus, "Configuration");

const columns = (
  doctors: { id: number; name: string }[],
  onEdit: (row: QueueConfigRow) => void
) =>
  helper.columns([
  selectionColumn<QueueConfigRow>(),
  helper.accessor((r) => r.doctor.user.name, {
    id: "doctor",
    header: sortHeader("Doctor"),
      cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
    }),
    helper.accessor((r) => r.doctor.department.name, {
    id: "department",
    header: sortHeader("Department"),
    }),
    helper.accessor("slotDurationMinutes", { header: sortHeader("Slot (min)") }),
    helper.accessor("maxTokensPerDay", { header: sortHeader("Max tokens/day") }),
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
            name: row.original.doctor.user.name,
            noun: "Configuration",
            deactivateHint:
              "New bookings for this doctor will be blocked until reactivated.",
          })}
        />
      </div>
    ),
  }),
]);

export function QueueConfigsTable({
  data,
  doctors,
}: {
  data: QueueConfigRow[];
  doctors: { id: number; name: string }[];
}) {
  const [editing, setEditing] = useState<QueueConfigRow | null>(null);
  const table = useTable({
    features,
    columns: useMemo(() => columns(doctors, setEditing), [doctors]),
    data,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });

  if (data.length === 0) {
    return (
      <TableEmpty
        message="No queue configurations yet. Set slot length and token caps per
          doctor."
        action={<QueueConfigDialog doctors={doctors} />}
      />
    );
  }

  return (
    <>
      <DataTable
        table={table}
        total={data.length}
        searchPlaceholder="Search configurations…"
        facets={[statusFacet]}
        exportFilename="queue-configurations"
        empty="No configurations match these filters."
      />
      {editing && (
        <QueueConfigDialog
          config={editing}
          doctors={doctors}
          open
          onOpenChange={(v) => {
            if (!v) setEditing(null);
          }}
        />
      )}
    </>
  );
}
