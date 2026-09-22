"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createColumnHelper,
  useTable,
} from "@tanstack/react-table";
import {
  appointmentTypeFacet,
  ExpandedActions,
  ExpandedList,
  filterIncludesAny,
  queueStatusFacet,
  RowAction,
  RowActions,
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
  menuItems: (row: QueueRow) => RowAction[]
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
      <div className="flex justify-end">
        <RowActions items={menuItems(row.original)} />
      </div>
    ),
  }),
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
          { label: "Phone", value: row.patient.phone },
          {
            label: "Doctor",
            value: `${row.doctor.user.name} · ${row.doctor.department.name}`,
          },
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

// Reception actions (Bill/Reschedule/Cancel) and doctor actions (Consult)
// share one table: the variant picks the menu, the panel, and whether the
// billing dialogs mount. Reception-only imports (InvoiceDialog) never load
// for the doctor route.
export function QueueTable({
  data,
  variant = "reception",
}: {
  data: QueueRow[];
  variant?: "reception" | "doctor";
}) {
  const [billingId, setBillingId] = useState<number | null>(null);
  const [rescheduling, setRescheduling] = useState<QueueRow | null>(null);
  const router = useRouter();
  const isReception = variant === "reception";

  const menuItems = useMemo(
    () =>
      isReception
        ? (row: QueueRow) =>
            queueRowItems(row, setBillingId, setRescheduling)
        : (row: QueueRow) =>
            row.status === "in_progress"
              ? [
                  {
                    label: "Consult",
                    onSelect: () =>
                      router.push(`/doctor/consultation/${row.id}`),
                  },
                ]
              : [],
    [isReception, router]
  );
  const table = useTable({
    features,
    columns: useMemo(() => columns(menuItems), [menuItems]),
    data,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-md border py-12 text-center">
        <p className="text-sm text-muted-foreground">
          {isReception
            ? "No patients in queue for this doctor or date. Book a new appointment or adjust filters."
            : "No appointments scheduled for today. New bookings will appear here automatically."}
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
        facets={isReception ? [queueStatusFacet, appointmentTypeFacet] : [queueStatusFacet]}
        exportFilename={isReception ? "queue" : "doctor-queue"}
        empty="No visits match these filters."
        mobileTitle={(row) => `#${row.tokenNumber} · ${row.patient.name}`}
        mobileSummary={(row) => (
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <StatusBadge status={row.status} />
            {isReception ? row.doctor.user.name : row.patient.phone}
          </span>
        )}
        renderExpanded={(row) =>
          isReception ? (
            queuePanel(row, setBillingId, setRescheduling)
          ) : (
            <div className="flex flex-col gap-2">
              <ExpandedList
                items={[
                  {
                    label: "Status",
                    value: <StatusBadge status={row.status} />,
                  },
                  { label: "Phone", value: row.patient.phone },
                  {
                    label: "Type",
                    value:
                      row.type === "walk_in" ? "Walk-in" : "Scheduled",
                  },
                ]}
              />
              <ExpandedActions items={menuItems(row)} />
            </div>
          )
        }
      />
      {isReception && (
        <InvoiceDialog
          key={billingId ?? "none"}
          appointmentId={billingId}
          open={billingId !== null}
          onOpenChange={(open) => {
            if (!open) setBillingId(null);
          }}
        />
      )}
      {isReception && rescheduling && (
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
