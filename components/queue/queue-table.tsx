"use client";

import { useMemo, useState } from "react";
import {
  createColumnHelper,
  useTable,
} from "@tanstack/react-table";
import {
  appointmentTypeFacet,
  ExpandedActions,
  ExpandedList,
  expandColumn,
  filterIncludesAny,
  queueStatusFacet,
  RowAction,
  RowActions,
  secondaryColumnClass,
  selectionColumn,
  sortHeader,
  tableFeaturesFull,
} from "@/components/table/table-helpers";
import { DataTable } from "@/components/table/data-table";
import { toast } from "sonner";
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

const columns = (
  onBill: (appointmentId: number) => void,
  onReschedule: (row: QueueRow) => void
) =>
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
    meta: { className: secondaryColumnClass },
  }),
  helper.accessor("type", {
    header: sortHeader("Type"),
    filterFn: filterIncludesAny,
    cell: ({ getValue }) => (getValue() === "walk_in" ? "Walk-in" : "Scheduled"),
    meta: { className: secondaryColumnClass },
  }),
  helper.accessor("status", {
    header: sortHeader("Status"),
    filterFn: filterIncludesAny,
    cell: ({ getValue }) => <StatusBadge status={getValue()} />,
    meta: { className: secondaryColumnClass },
  }),
  helper.display({
    id: "actions",
    header: "",
    enableHiding: false,
    meta: { className: secondaryColumnClass },
    cell: ({ row }) => (
      <div className="flex justify-end">
        <RowActions
          items={queueRowItems(row.original, onBill, onReschedule)}
        />
      </div>
    ),
  }),
  expandColumn<QueueRow>(),
]);

// One item list drives both the ellipsis menu and the expanded panel,
// so the two can never drift apart.
function queueRowItems(
  row: QueueRow,
  onBill: (appointmentId: number) => void,
  onReschedule: (row: QueueRow) => void
): RowAction[] {
  return [
    { label: "Bill", onSelect: () => onBill(row.id) },
    ...(row.status === "waiting"
      ? [
          {
            label: "Reschedule",
            onSelect: () => onReschedule(row),
          },
          {
            label: "Cancel",
            destructive: true,
            onSelect: () => cancel(row),
            confirm: {
              title: `Cancel token ${row.tokenNumber}?`,
              description: `${row.patient.name} will be removed from today's queue. This is logged and cannot be undone from here.`,
              confirmLabel: "Cancel appointment",
            },
          },
        ]
      : []),
  ];
}

function queuePanel(
  row: QueueRow,
  onBill: (appointmentId: number) => void,
  onReschedule: (row: QueueRow) => void
) {
  return (
    <div className="flex flex-col gap-2">
      <ExpandedList
        items={[
          { label: "Status", value: <StatusBadge status={row.status} /> },
          { label: "Doctor", value: row.doctor.user.name },
          {
            label: "Type",
            value: row.type === "walk_in" ? "Walk-in" : "Scheduled",
          },
        ]}
      />
      <ExpandedActions
        items={queueRowItems(row, onBill, onReschedule)}
      />
    </div>
  );
}

export function QueueTable({ data }: { data: QueueRow[] }) {
  const [billingId, setBillingId] = useState<number | null>(null);
  const [rescheduling, setRescheduling] = useState<QueueRow | null>(null);
  const table = useTable({
    features,
    columns: useMemo(
      () => columns(setBillingId, setRescheduling),
      []
    ),
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
        mobileTitle={(row) => `#${row.tokenNumber} · ${row.patient.name}`}
        mobileSummary={(row) => (
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <StatusBadge status={row.status} />
            {row.doctor.user.name}
          </span>
        )}
        renderExpanded={(row) =>
          queuePanel(row, setBillingId, setRescheduling)
        }
      />
      <InvoiceDialog
        key={billingId ?? "none"}
        appointmentId={billingId}
        open={billingId !== null}
        onOpenChange={(open) => {
          if (!open) setBillingId(null);
        }}
      />
      {rescheduling && (
        <RescheduleDialog
          row={rescheduling}
          open
          onOpenChange={(v) => {
            if (!v) setRescheduling(null);
          }}
        />
      )}
    </>
  );
}
