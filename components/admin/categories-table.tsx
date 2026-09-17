"use client";

import {
  createColumnHelper,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CategoryDialog } from "@/components/admin/category-dialog";
import type { CategoryRow } from "@/db/queries/categories";
import { setCategoryStatus } from "@/app/admin/categories/actions";

const features = tableFeatures({});
const helper = createColumnHelper<typeof features, CategoryRow>();

const typeLabels = {
  diagnosis: "Diagnosis",
  symptom: "Symptom",
  complaint: "Complaint",
} as const;

async function toggleStatus(row: CategoryRow) {
  const next = row.status === "active" ? "inactive" : "active";
  const result = await setCategoryStatus({ id: row.id, status: next });
  if (!result.ok) toast.error(result.error);
  else
    toast.success(
      next === "active" ? "Category activated." : "Category deactivated."
    );
}

const columns = helper.columns([
  helper.accessor("name", {
    header: "Name",
    cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
  }),
  helper.accessor("type", {
    header: "Type",
    cell: ({ getValue }) => typeLabels[getValue()],
  }),
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void toggleStatus(row.original)}
        >
          {row.original.status === "active" ? "Deactivate" : "Activate"}
        </Button>
        <CategoryDialog category={row.original} />
      </div>
    ),
  }),
]);

export function CategoriesTable({ data }: { data: CategoryRow[] }) {
  const table = useTable({ features, columns, data });

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 border py-12 text-center">
        <p className="text-sm text-muted-foreground">
          No categories yet. Add the first one for clinical coding.
        </p>
        <CategoryDialog />
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
