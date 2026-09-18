"use client";

import { useMemo } from "react";
import {
  createColumnHelper,
  useTable,
} from "@tanstack/react-table";
import {
  sortHeader,
  tableFeaturesFull,
  TablePagination,
} from "@/components/table/table-helpers";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
      <div className="flex flex-col items-center gap-3 border py-12 text-center">
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
      <div className="overflow-x-auto">
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
      </div>
      <TablePagination table={table} total={data.length} />
    </>
  );
}
