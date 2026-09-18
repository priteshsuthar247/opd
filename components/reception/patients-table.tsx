"use client";

import { useEffect } from "react";
import {
  createColumnHelper,
  useTable,
} from "@tanstack/react-table";
import {
  DataTableToolbar,
  filterIncludesAny,
  sortHeader,
  statusFacet,
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
import { PatientDialog } from "@/components/reception/patient-dialog";
import type { PatientRow } from "@/db/queries/patients";
import { setPatientStatus } from "@/app/reception/patients/actions";

const features = tableFeaturesFull;
const helper = createColumnHelper<typeof features, PatientRow>();

function ageOn(dob: string | null): string {
  if (!dob) return "—";
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return "—";
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age < 0 ? "—" : String(age);
}

async function toggleStatus(row: PatientRow) {
  const next = row.status === "active" ? "inactive" : "active";
  const result = await setPatientStatus({ id: row.id, status: next });
  if (!result.ok) toast.error(result.error);
  else
    toast.success(
      next === "active" ? "Patient activated." : "Patient deactivated."
    );
}

const columns = helper.columns([
  helper.accessor("name", {
    header: sortHeader("Name"),
    cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
  }),
  helper.accessor("phone", { header: sortHeader("Phone") }),
  helper.display({
    id: "age",
    header: "Age",
    cell: ({ row }) => ageOn(row.original.dob),
  }),
  helper.accessor("gender", {
    header: sortHeader("Gender"),
    cell: ({ getValue }) => getValue() ?? "—",
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
    cell: ({ row }) => (
      <div className="flex justify-end gap-2">
        {row.original.status === "active" ? (
          <ConfirmButton
            label="Deactivate"
            title={`Deactivate ${row.original.name}?`}
            description="Their history stays, but no new appointments can be booked for them."
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
        <PatientDialog patient={row.original} />
      </div>
    ),
  }),
]);

export function PatientsTable({ data }: { data: PatientRow[] }) {
  // "/" focuses the toolbar search from anywhere on the page (unless
  // already typing).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      const typing =
        el !== null &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.tagName === "SELECT" ||
          el.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        document.getElementById("table-search")?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  const table = useTable({
    features,
    columns,
    data,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });

  return (
    <div className="flex flex-col gap-3">
      <DataTableToolbar
        table={table}
        searchPlaceholder="Search by name or phone…"
        facets={[statusFacet]}
      />
      {table.getRowModel().rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 border py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {data.length === 0
              ? "No patients registered yet."
              : "No patients match this search."}
          </p>
          {data.length === 0 && <PatientDialog />}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
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
          </div>
          <TablePagination table={table} total={data.length} />
        </>
      )}
    </div>
  );
}
