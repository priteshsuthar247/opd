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
import { BillingItemDialog } from "@/components/admin/billing-item-dialog";
import type { BillingItemRow } from "@/db/queries/billing-items";
import { setBillingItemStatus } from "@/app/admin/billing-items/actions";

const features = tableFeaturesFull;
const helper = createColumnHelper<typeof features, BillingItemRow>();

const toggleStatus = makeStatusToggle(setBillingItemStatus, "Billing item");

// One item list drives both the ellipsis menu and the expanded panel.
function billingItemMenu(row: BillingItemRow, onEdit: (row: BillingItemRow) => void) {
  return statusRowItems(row, {
    onEdit: () => onEdit(row),
    onToggle: toggleStatus,
    name: row.name,
    noun: "Billing item",
    deactivateHint:
      "Past invoices keep it, but it can no longer be added to new ones.",
  });
}

const columns = (onEdit: (row: BillingItemRow) => void) =>
  helper.columns([
  selectionColumn<BillingItemRow>(),
  helper.accessor("name", {
    header: sortHeader("Name"),
    cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
  }),
  helper.accessor("type", {
    header: sortHeader("Type"),
    meta: { className: secondaryColumnClass },
  }),
  helper.accessor("amount", {
    header: sortHeader("Amount (₹)"),
    cell: ({ getValue }) => Number(getValue()).toFixed(2),
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
        <RowActions items={billingItemMenu(row.original, onEdit)} />
      </div>
    ),
  }),
  expandColumn<BillingItemRow>(),
]);

export function BillingItemsTable({ data }: { data: BillingItemRow[] }) {
  const [editing, setEditing] = useState<BillingItemRow | null>(null);
  const table = useTable({
    features,
    columns: useMemo(() => columns(setEditing), []),
    data,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });

  if (data.length === 0) {
    return (
      <TableEmpty
        message="No billing items yet. Add the first one for invoice extras."
        action={<BillingItemDialog />}
      />
    );
  }

  return (
    <>
      <DataTable
        table={table}
        total={data.length}
        searchPlaceholder="Search billing items…"
        facets={[statusFacet]}
        exportFilename="billing-items"
        empty="No billing items match these filters."
        mobileTitle={(row) => row.name}
        mobileSummary={(row) => (
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <ActiveBadge status={row.status} />₹
            {Number(row.amount).toFixed(2)}
          </span>
        )}
        renderExpanded={(row) => (
          <div className="flex flex-col gap-2">
            <ExpandedList
              items={[
                { label: "Status", value: <ActiveBadge status={row.status} /> },
                { label: "Type", value: row.type ?? "—" },
                { label: "Amount", value: Number(row.amount).toFixed(2) },
              ]}
            />
            <ExpandedActions items={billingItemMenu(row, setEditing)} />
          </div>
        )}
      />
      {editing && (
        <BillingItemDialog
          item={editing}
          open
          onOpenChange={(v) => {
            if (!v) setEditing(null);
          }}
        />
      )}
    </>
  );
}
