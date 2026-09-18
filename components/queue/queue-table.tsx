"use client";

import { useMemo, useState } from "react";
import {
  createColumnHelper,
  useTable,
} from "@tanstack/react-table";
import {
  appointmentTypeFacet,
  filterIncludesAny,
  queueStatusFacet,
  selectionColumn,
  sortHeader,
  tableFeaturesFull,
} from "@/components/table/table-helpers";
import { DataTable } from "@/components/table/data-table";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { InvoiceDialog } from "@/components/reception/invoice-dialog";
import { RescheduleDialog } from "@/components/queue/reschedule-dialog";
import { StatusBadge } from "@/components/queue/status-badge";
import type { QueueRow } from "@/db/queries/appointments";
import { cancelAppointment } from "@/app/reception/queue/actions";

const features = tableFeaturesFull;
const helper = createColumnHelper<typeof features, QueueRow>();

async function cancel(row: QueueRow) {
  const result = await cancelAppointment({ id: row.id });
  if (!result.ok) toast.error(result.error);
  else toast.success(`Token ${row.tokenNumber} cancelled.`);
}

const columns = (onBill: (appointmentId: number) => void) =>
  helper.columns([
  selectionColumn<QueueRow>(),
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
  helper.accessor("type", {
    header: sortHeader("Type"),
    filterFn: filterIncludesAny,
    cell: ({ getValue }) => (getValue() === "walk_in" ? "Walk-in" : "Scheduled"),
  }),
  helper.accessor("status", {
    header: sortHeader("Status"),
    filterFn: filterIncludesAny,
    cell: ({ getValue }) => <StatusBadge status={getValue()} />,
  }),
  helper.display({
    id: "actions",
    header: "",
    enableHiding: false,
    cell: ({ row }) => (
      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onBill(row.original.id)}
        >
          Bill
        </Button>
        {row.original.status === "waiting" && (
          <>
            <ConfirmButton
              label="Cancel"
              title={`Cancel token ${row.original.tokenNumber}?`}
              description={`${row.original.patient.name} will be removed from today's queue. This is logged and cannot be undone from here.`}
              confirmLabel="Cancel appointment"
              onConfirm={() => cancel(row.original)}
            />
            <RescheduleDialog row={row.original} />
          </>
        )}
      </div>
    ),
  }),
]);

export function QueueTable({ data }: { data: QueueRow[] }) {
  const [billingId, setBillingId] = useState<number | null>(null);
  const table = useTable({
    features,
    columns: useMemo(() => columns(setBillingId), []),
    data,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-md border py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Queue is empty for this selection.
        </p>
      </div>
    );
  }

  return (
    <>
      <DataTable
        table={table}
        total={data.length}
        searchPlaceholder="Search queue…"
        facets={[queueStatusFacet, appointmentTypeFacet]}
        exportFilename="queue"
        empty="No visits match these filters."
      />
      <InvoiceDialog
        key={billingId ?? "none"}
        appointmentId={billingId}
        open={billingId !== null}
        onOpenChange={(open) => {
          if (!open) setBillingId(null);
        }}
      />
    </>
  );
}
