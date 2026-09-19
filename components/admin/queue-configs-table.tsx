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
import { QueueConfigDialog } from "@/components/admin/queue-config-dialog";
import type { QueueConfigRow } from "@/db/queries/queue-configs";
import { setQueueConfigStatus } from "@/app/admin/queue/actions";

const features = tableFeaturesFull;
const helper = createColumnHelper<typeof features, QueueConfigRow>();

async function toggleStatus(row: QueueConfigRow) {
  const next = row.status === "active" ? "inactive" : "active";
  const result = await setQueueConfigStatus({ id: row.id, status: next });
  if (!result.ok) toast.error(result.error);
  else
    toast.success(
      next === "active" ? "Configuration activated." : "Configuration deactivated."
    );
}

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
                    title: `Deactivate ${row.original.doctor.user.name}'s queue rules?`,
                    description:
                      "New bookings for this doctor will be blocked until reactivated.",
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
      <div className="flex flex-col items-center gap-3 rounded-md border py-12 text-center">
        <p className="text-sm text-muted-foreground">
          No queue configurations yet. Set slot length and token caps per
          doctor.
        </p>
        <QueueConfigDialog doctors={doctors} />
      </div>
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
