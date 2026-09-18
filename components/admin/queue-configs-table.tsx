"use client";

import { useMemo } from "react";
import {
  createColumnHelper,
  useTable,
} from "@tanstack/react-table";
import {
  filterIncludesAny,
  selectionColumn,
  sortHeader,
  statusFacet,
  tableFeaturesFull,
} from "@/components/table/table-helpers";
import { DataTable } from "@/components/table/data-table";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
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

const columns = (doctors: { id: number; name: string }[]) =>
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
        <div className="flex justify-end gap-2">
        {row.original.status === "active" ? (
          <ConfirmButton
            label="Deactivate"
            title={`Deactivate ${row.original.doctor.user.name}'s queue rules?`}
            description="New bookings for this doctor will be blocked until reactivated."
            confirmLabel="Deactivate"
            onConfirm={() => toggleStatus(row.original)}
          />
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void toggleStatus(row.original)}
          >
            Activate
          </Button>
        )}
          <QueueConfigDialog config={row.original} doctors={doctors} />
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
  const table = useTable({
    features,
    columns: useMemo(() => columns(doctors), [doctors]),
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
    <DataTable
      table={table}
      total={data.length}
      searchPlaceholder="Search configurations…"
      facets={[statusFacet]}
      exportFilename="queue-configurations"
      empty="No configurations match these filters."
    />
  );
}
