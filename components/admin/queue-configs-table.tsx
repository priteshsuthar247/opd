"use client";

import { useMemo } from "react";
import {
  createColumnHelper,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
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

const features = tableFeatures({});
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
      header: "Doctor",
      cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
    }),
    helper.accessor((r) => r.doctor.department.name, {
      id: "department",
      header: "Department",
    }),
    helper.accessor("slotDurationMinutes", { header: "Slot (min)" }),
    helper.accessor("maxTokensPerDay", { header: "Max tokens/day" }),
    helper.accessor("status", {
      header: "Status",
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
  );
}
