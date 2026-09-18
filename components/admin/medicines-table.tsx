"use client";

import {
  createColumnHelper,
  useTable,
} from "@tanstack/react-table";
import {
  filterIncludesAny,
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
import { MedicineDialog } from "@/components/admin/medicine-dialog";
import type { MedicineRow } from "@/db/queries/medicines";
import { setMedicineStatus } from "@/app/admin/medicines/actions";

const features = tableFeaturesFull;
const helper = createColumnHelper<typeof features, MedicineRow>();

async function toggleStatus(row: MedicineRow) {
  const next = row.status === "active" ? "inactive" : "active";
  const result = await setMedicineStatus({ id: row.id, status: next });
  if (!result.ok) toast.error(result.error);
  else
    toast.success(
      next === "active" ? "Medicine activated." : "Medicine deactivated."
    );
}

const columns = helper.columns([
  helper.accessor("name", {
    header: sortHeader("Name"),
    cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
  }),
  helper.accessor("genericName", { header: sortHeader("Generic name") }),
  helper.accessor("form", { header: sortHeader("Form") }),
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
            title={`Deactivate ${row.original.name}?`}
            description="Existing prescriptions keep it, but it can no longer be picked for new ones."
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
        <MedicineDialog medicine={row.original} />
      </div>
    ),
  }),
]);

export function MedicinesTable({ data }: { data: MedicineRow[] }) {
  const table = useTable({
    features,
    columns,
    data,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-md border py-12 text-center">
        <p className="text-sm text-muted-foreground">
          No medicines yet. Add the first one for prescription building.
        </p>
        <MedicineDialog />
      </div>
    );
  }

  return (
    <DataTable
      table={table}
      total={data.length}
      searchPlaceholder="Search medicines…"
      facets={[statusFacet]}
      empty="No medicines match these filters."
    />
  );
}
