"use client";

import {
  createColumnHelper,
  useTable,
} from "@tanstack/react-table";
import {
  sortHeader,
  tableFeaturesFull,
} from "@/components/table/table-helpers";
import { DataTable } from "@/components/table/data-table";
import { SettingDialog } from "@/components/admin/setting-dialog";
import type { SettingRow } from "@/db/queries/settings";
import { settingDescriptions } from "@/lib/validations/settings";

const features = tableFeaturesFull;
const helper = createColumnHelper<typeof features, SettingRow>();

const columns = helper.columns([
  helper.accessor("key", {
    header: sortHeader("Key"),
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
    header: sortHeader("Value"),
    cell: ({ getValue }) => (
      <code className="text-xs">{JSON.stringify(getValue())}</code>
    ),
  }),
  helper.display({
    id: "actions",
    header: "",
    enableHiding: false,
    cell: ({ row }) => (
      <div className="flex justify-end">
        <SettingDialog setting={row.original} />
      </div>
    ),
  }),
]);

export function SettingsTable({ data }: { data: SettingRow[] }) {
  const table = useTable({
    features,
    columns,
    data,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });

  return (
    <DataTable
      table={table}
      total={data.length}
      searchPlaceholder="Search settings…"
      empty="No settings match this search."
    />
  );
}
