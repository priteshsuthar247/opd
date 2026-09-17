"use client";

import {
  createColumnHelper,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SettingDialog } from "@/components/admin/setting-dialog";
import type { SettingRow } from "@/db/queries/settings";
import { settingDescriptions } from "@/lib/validations/settings";

const features = tableFeatures({});
const helper = createColumnHelper<typeof features, SettingRow>();

const columns = helper.columns([
  helper.accessor("key", {
    header: "Key",
    cell: ({ getValue }) => (
      <span className="font-medium">{getValue()}</span>
    ),
  }),
  helper.display({
    id: "purpose",
    header: "Purpose",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {settingDescriptions[
          row.original.key as keyof typeof settingDescriptions
        ] ?? "—"}
      </span>
    ),
  }),
  helper.accessor("value", {
    header: "Value",
    cell: ({ getValue }) => (
      <code className="text-xs">{JSON.stringify(getValue())}</code>
    ),
  }),
  helper.display({
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <div className="flex justify-end">
        <SettingDialog setting={row.original} />
      </div>
    ),
  }),
]);

export function SettingsTable({ data }: { data: SettingRow[] }) {
  const table = useTable({ features, columns, data });

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
