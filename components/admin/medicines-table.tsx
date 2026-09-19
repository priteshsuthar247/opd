"use client";

import { useMemo, useState } from "react";

import {
  createColumnHelper,
  useTable,
} from "@tanstack/react-table";
import {
  filterIncludesAny,
  makeStatusToggle,
  RowActions,
  selectionColumn,
  sortHeader,
  statusFacet,
  statusRowItems,
  tableFeaturesFull,
} from "@/components/table/table-helpers";
import { DataTable } from "@/components/table/data-table";
import { TableEmpty } from "@/components/ui/table-empty";
import { ActiveBadge } from "@/components/ui/active-badge";
import { MedicineDialog } from "@/components/admin/medicine-dialog";
import type { MedicineRow } from "@/db/queries/medicines";
import { setMedicineStatus } from "@/app/admin/medicines/actions";

const features = tableFeaturesFull;
const helper = createColumnHelper<typeof features, MedicineRow>();

const toggleStatus = makeStatusToggle(setMedicineStatus, "Medicine");

const columns = (onEdit: (row: MedicineRow) => void) =>
  helper.columns([
  selectionColumn<MedicineRow>(),
  helper.accessor("name", {
    header: sortHeader("Name"),
    cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
  }),
  helper.accessor("genericName", { header: sortHeader("Generic name") }),
  helper.accessor("form", { header: sortHeader("Form") }),
  helper.accessor("status", {
    header: sortHeader("Status"),
    filterFn: filterIncludesAny,
    cell: ({ getValue }) => <ActiveBadge status={String(getValue())} />,
  }),
  helper.display({
    id: "actions",
    header: "",
    enableHiding: false,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <RowActions
          items={statusRowItems(row.original, {
            onEdit: () => onEdit(row.original),
            onToggle: toggleStatus,
            name: row.original.name,
            noun: "Medicine",
            deactivateHint:
              "Existing prescriptions keep it, but it can no longer be picked for new ones.",
          })}
        />
      </div>
    ),
  }),
]);

export function MedicinesTable({ data }: { data: MedicineRow[] }) {
  const [editing, setEditing] = useState<MedicineRow | null>(null);
  const table = useTable({
    features,
    columns: useMemo(() => columns(setEditing), []),
    data,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });

  if (data.length === 0) {
    return (
      <TableEmpty
        message="No medicines yet. Add the first one for prescription building."
        action={<MedicineDialog />}
      />
    );
  }

  return (
    <>
      <DataTable
        table={table}
        total={data.length}
        searchPlaceholder="Search medicines…"
        facets={[statusFacet]}
        exportFilename="medicines"
        empty="No medicines match these filters."
      />
      {editing && (
        <MedicineDialog
          medicine={editing}
          open
          onOpenChange={(v) => {
            if (!v) setEditing(null);
          }}
        />
      )}
    </>
  );
}
