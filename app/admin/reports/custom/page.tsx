import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/roles";
import { listDepartments } from "@/db/queries/departments";
import { listDoctors } from "@/db/queries/doctors";
import { ReportPatientPicker } from "@/components/admin/report-patient-picker";
import {
  ReportResultsSection,
  type ReportFilters,
} from "@/components/admin/report-results-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableSkeleton } from "@/components/shell/loading-blocks";

const statuses = [
  "waiting",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
] as const;

export default async function CustomReportPage({
  searchParams,
}: {
  searchParams: Promise<{
    departmentId?: string;
    doctorId?: string;
    patientId?: string;
    from?: string;
    to?: string;
    status?: string;
    diagnosis?: string;
  }>;
}) {
  if (!(await requireRole("admin"))) redirect("/");
  const params = await searchParams;
  const num = (s: string | undefined) =>
    s !== undefined && /^\d+$/.test(s) ? Number(s) : undefined;
  const today = new Date();
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const okDate = (s: string | undefined) =>
    s !== undefined && /^\d{4}-\d{2}-\d{2}$/.test(s);
  const to = okDate(params.to) ? params.to! : fmt(today);
  const from = okDate(params.from)
    ? params.from!
    : fmt(new Date(today.getTime() - 29 * 86400000));
  const departmentId = num(params.departmentId);
  const doctorId = num(params.doctorId);
  const patientId = num(params.patientId);
  const status = (
    statuses as readonly string[]
  ).includes(params.status ?? "")
    ? (params.status as (typeof statuses)[number])
    : undefined;
  const diagnosis = params.diagnosis?.trim() || undefined;

  // Masters first (cheap): the filter bar paints immediately while
  // the range bundle streams inside the results section below.
  const [departments, doctors] = await Promise.all([
    listDepartments(),
    listDoctors(),
  ]);

  const filters: ReportFilters = {
    departmentId,
    doctorId,
    patientId,
    from,
    to,
    status,
    diagnosis,
  };

  return (
    <main className="w-full px-4 lg:px-6 py-4 md:py-6">
      <form
        action="/admin/reports/custom"
        method="get"
        className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4"
      >
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">Department</span>
          <Select
            name="departmentId"
            defaultValue={departmentId ? String(departmentId) : "all"}
            items={{
              all: "All",
              ...Object.fromEntries(departments.map((d) => [String(d.id), d.name])),
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={String(d.id)}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">Doctor</span>
          <Select
            name="doctorId"
            defaultValue={doctorId ? String(doctorId) : "all"}
            items={{
              all: "All",
              ...Object.fromEntries(doctors.map((d) => [String(d.id), d.user.name])),
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {doctors.map((d) => (
                <SelectItem key={d.id} value={String(d.id)}>
                  {d.user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">From</span>
          <Input type="date" name="from" defaultValue={from} />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">To</span>
          <Input type="date" name="to" defaultValue={to} />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">Status</span>
          <Select
            name="status"
            defaultValue={status ?? "all"}
            items={{
              all: "All",
              waiting: "Waiting",
              in_progress: "In Progress",
              completed: "Completed",
              cancelled: "Cancelled",
              no_show: "No-show",
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">Diagnosis contains</span>
          <Input
            name="diagnosis"
            defaultValue={diagnosis ?? ""}
            placeholder="fever…"
          />
        </label>
        <div className="col-span-2 flex items-end gap-2 sm:col-span-4">
          <Button type="submit" variant="outline" size="sm">
            Apply
          </Button>
          {patientId !== undefined && (
            <span className="text-xs text-muted-foreground">
              Patient filter: #{patientId} (
              <a className="underline" href="/admin/reports/custom">
                clear
              </a>
              )
            </span>
          )}
        </div>
      </form>
      <div className="mb-4">
        <ReportPatientPicker
          basePath="/admin/reports/custom"
          preserveParams
        />
      </div>
      <Suspense fallback={<TableSkeleton rows={8} />}>
        <ReportResultsSection filters={filters} />
      </Suspense>
    </main>
  );
}
