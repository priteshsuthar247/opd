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
import { DoctorDialog } from "@/components/admin/doctor-dialog";
import type { DoctorRow } from "@/db/queries/doctors";
import { setDoctorStatus } from "@/app/admin/doctors/actions";

const features = tableFeaturesFull;
const helper = createColumnHelper<typeof features, DoctorRow>();

async function toggleStatus(row: DoctorRow) {
  const next = row.status === "active" ? "inactive" : "active";
  const result = await setDoctorStatus({ id: row.id, status: next });
  if (!result.ok) toast.error(result.error);
  else
    toast.success(
      next === "active" ? "Doctor activated." : "Doctor deactivated."
    );
}

const columns = (departments: { id: number; name: string }[]) =>
  helper.columns([
  helper.accessor((r) => r.user.name, {
    id: "name",
    header: sortHeader("Doctor"),
    cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
  }),
  helper.accessor((r) => r.department.name, {
    id: "department",
    header: sortHeader("Department"),
  }),
  helper.accessor("qualification", { header: sortHeader("Qualification") }),
  helper.accessor("consultationFee", {
    header: sortHeader("Fee (₹)"),
    cell: ({ getValue }) => Number(getValue()).toFixed(2),
  }),
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
            title={`Deactivate ${row.original.user.name}?`}
            description="Their queue and history stay, but no new appointments can be booked with them."
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
        <DoctorDialog doctor={row.original} departments={departments} />
      </div>
    ),
  }),
]);

export function DoctorsTable({
  data,
  departments,
}: {
  data: DoctorRow[];
  departments: { id: number; name: string }[];
}) {
  const table = useTable({
    features,
    columns: useMemo(() => columns(departments), [departments]),
    data,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 border py-12 text-center">
        <p className="text-sm text-muted-foreground">
          No doctors yet. Add the first one with login, profile and hours.
        </p>
        <DoctorDialog departments={departments} />
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
