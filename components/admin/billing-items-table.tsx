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
import { BillingItemDialog } from "@/components/admin/billing-item-dialog";
import type { BillingItemRow } from "@/db/queries/billing-items";
import { setBillingItemStatus } from "@/app/admin/billing-items/actions";

const features = tableFeaturesFull;
const helper = createColumnHelper<typeof features, BillingItemRow>();

async function toggleStatus(row: BillingItemRow) {
  const next = row.status === "active" ? "inactive" : "active";
  const result = await setBillingItemStatus({ id: row.id, status: next });
  if (!result.ok) toast.error(result.error);
  else
    toast.success(
      next === "active" ? "Billing item activated." : "Billing item deactivated."
    );
}

const columns = helper.columns([
  helper.accessor("name", {
    header: sortHeader("Name"),
    cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
  }),
  helper.accessor("type", { header: sortHeader("Type") }),
  helper.accessor("amount", {
    header: sortHeader("Amount (₹)"),
    cell: ({ getValue }) => Number(getValue()).toFixed(2),
  }),
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
            description="Past invoices keep it, but it can no longer be added to new ones."
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
        <BillingItemDialog item={row.original} />
      </div>
    ),
  }),
]);

export function BillingItemsTable({ data }: { data: BillingItemRow[] }) {
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
          No billing items yet. Add the first one for invoice extras.
        </p>
        <BillingItemDialog />
      </div>
    );
  }

  return (
    <DataTable
      table={table}
      total={data.length}
      searchPlaceholder="Search billing items…"
      facets={[statusFacet]}
      empty="No billing items match these filters."
    />
  );
}
