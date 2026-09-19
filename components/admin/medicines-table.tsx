"use client";

import { useMemo, useState } from "react";

import {
  createColumnHelper,
  useTable,
} from "@tanstack/react-table";
import {
  ExpandedActions,
  ExpandedList,
  expandColumn,
  filterIncludesAny,
  makeStatusToggle,
  RowActions,
  secondaryColumnClass,
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

// One item list drives both the ellipsis menu and the expanded panel.
function medicineMenu(row: MedicineRow, onEdit: (row: MedicineRow) => void) {
  return statusRowItems(row, {
    onEdit: () => onEdit(row),
    onToggle: toggleStatus,
    name: row.name,
    noun: "Medicine",
    deactivateHint:
      "Existing prescriptions keep it, but it can no longer be picked for new ones.",
  });
}

const columns = (onEdit: (row: MedicineRow) => void) =>
  helper.columns([
  selectionColumn<MedicineRow>(),
  helper.accessor("name", {
    header: sortHeader("Name"),
    cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
  }),
  helper.accessor("genericName", {
    header: sortHeader("Generic name"),
    meta: { className: secondaryColumnClass },
  }),
  helper.accessor("form", {
    header: sortHeader("Form"),
    meta: { className: secondaryColumnClass },
  }),
  helper.accessor("status", {
    header: sortHeader("Status"),
    filterFn: filterIncludesAny,
    cell: ({ getValue }) => <ActiveBadge status={String(getValue())} />,
    meta: { className: secondaryColumnClass },
  }),
  helper.display({
    id: "actions",
    header: "",
    enableHiding: false,
    meta: { className: secondaryColumnClass },
    cell: ({ row }) => (
      <div className="flex justify-end">
        <RowActions items={medicineMenu(row.original, onEdit)} />
      </div>
    ),
  }),
  expandColumn<MedicineRow>(),
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
        renderExpanded={(row) => (
          <div className="flex flex-col gap-2">
            <ExpandedList
              items={[
                { label: "Status", value: <ActiveBadge status={row.status} /> },
                { label: "Generic name", value: row.genericName ?? "—" },
                { label: "Form", value: row.form ?? "—" },
              ]}
            />
            <ExpandedActions items={medicineMenu(row, setEditing)} />
          </div>
        )}
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
