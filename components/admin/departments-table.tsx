"use client";

import { useState } from "react";
import {
  createColumnHelper,
  useTable,
} from "@tanstack/react-table";
import { ActiveBadge } from "@/components/ui/active-badge";
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
import { DepartmentDialog } from "@/components/admin/department-dialog";
import type { DepartmentRow } from "@/db/queries/departments";
import { setDepartmentStatus } from "@/app/admin/departments/actions";

const features = tableFeaturesFull;
const helper = createColumnHelper<typeof features, DepartmentRow>();

const toggleStatus = makeStatusToggle(setDepartmentStatus, "Department");

// One item list drives both the ellipsis menu and the expanded panel.
function departmentMenu(row: DepartmentRow, onEdit: (row: DepartmentRow) => void) {
  return statusRowItems(row, {
    onEdit: () => onEdit(row),
    onToggle: toggleStatus,
    name: row.name,
    noun: "Department",
    deactivateHint:
      "Doctors in this department stay untouched, but it can no longer be picked for new doctors.",
  });
}

const columns = (onEdit: (row: DepartmentRow) => void) =>
  helper.columns([
    selectionColumn<DepartmentRow>(),
    helper.accessor("name", {
      header: sortHeader("Name"),
      cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
    }),
    helper.accessor("code", {
      header: sortHeader("Code"),
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
          <RowActions items={departmentMenu(row.original, onEdit)} />
        </div>
      ),
    }),
    expandColumn<DepartmentRow>(),
  ]);

export function DepartmentsTable({ data }: { data: DepartmentRow[] }) {
  const [editing, setEditing] = useState<DepartmentRow | null>(null);
  const table = useTable({
    features,
    columns: columns(setEditing),
    data,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });

  if (data.length === 0) {
    return (
      <TableEmpty
        message="No departments yet. Add the first one to start organizing doctors."
        action={<DepartmentDialog />}
      />
    );
  }

  return (
    <>
      <DataTable
        table={table}
        total={data.length}
        searchPlaceholder="Search departments…"
        facets={[statusFacet]}
        empty="No departments match these filters."
        exportFilename="departments"
        mobileTitle={(row) => row.name}
        mobileSummary={(row) => <ActiveBadge status={row.status} />}
        renderExpanded={(row) => (
          <div className="flex flex-col gap-2">
            <ExpandedList items={[
              { label: "Status", value: <ActiveBadge status={row.status} /> },
              { label: "Code", value: row.code },
            ]} />
            <ExpandedActions items={departmentMenu(row, setEditing)} />
          </div>
        )}
      />
      {editing && (
        <DepartmentDialog
          department={editing}
          open
          onOpenChange={(v) => {
            if (!v) setEditing(null);
          }}
        />
      )}
    </>
  );
}
