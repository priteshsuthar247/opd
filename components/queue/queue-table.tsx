"use client";

import {
  createColumnHelper,
  useTable,
} from "@tanstack/react-table";
import {
  sortHeader,
  tableFeaturesFull,
  TablePagination,
} from "@/components/table/table-helpers";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

const columns = helper.columns([
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
    cell: ({ getValue }) => (getValue() === "walk_in" ? "Walk-in" : "Scheduled"),
  }),
  helper.accessor("status", {
    header: sortHeader("Status"),
    cell: ({ getValue }) => <StatusBadge status={getValue()} />,
  }),
  helper.display({
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={`/reception/invoices/${row.original.id}`}>Bill</Link>}
        />
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
  const table = useTable({
    features,
    columns,
    data,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 border py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Queue is empty for this selection.
        </p>
      </div>
    );
  }

  return (
    <>
      <Table>
      <TableHeader>
        {table.getHeaderGroups().map((group) => (
          <TableRow key={group.id}>
            {group.headers.map((header) => (
              <TableHead key={header.id}>
                {header.isPlaceholder ? null : (
                  <table.FlexRender header={header} />
                )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getAllCells().map((cell) => (
              <TableCell key={cell.id}>
                <table.FlexRender cell={cell} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
      </Table>
      <TablePagination table={table} total={data.length} />
    </>
  );
}
