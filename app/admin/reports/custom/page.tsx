import { redirect } from "next/navigation";
import { requireRole } from "@/lib/roles";
import { listDepartments } from "@/db/queries/departments";
import { listDoctors } from "@/db/queries/doctors";
import { listAppointmentsInRange } from "@/db/queries/reports";
import { ExportCsvButton } from "@/components/admin/export-csv-button";
import { ReportPatientPicker } from "@/components/admin/report-patient-picker";
import { StatusBadge } from "@/components/queue/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

  const [departments, doctors, rows] = await Promise.all([
    listDepartments(),
    listDoctors(),
    listAppointmentsInRange({ from, to }),
  ]);

  const filtered = rows.filter(
    (r) =>
      (departmentId === undefined || r.doctor.departmentId === departmentId) &&
      (doctorId === undefined || r.doctorId === doctorId) &&
      (patientId === undefined || r.patientId === patientId) &&
      (status === undefined || r.status === status) &&
      (diagnosis === undefined ||
        (r.consultation?.diagnosis ?? "")
          .toLowerCase()
          .includes(diagnosis.toLowerCase()))
  );

  const csvRows = filtered.map((r) => ({
    Date: r.date,
    Token: r.tokenNumber,
    Patient: r.patient.name,
    Phone: r.patient.phone,
    Doctor: r.doctor.user.name,
    Department: r.doctor.department.name,
    Type: r.type,
    Status: r.status,
    Diagnosis: r.consultation?.diagnosis ?? "",
  }));

  return (
    <main className="w-full px-4 lg:px-6 py-4 md:py-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">Custom Report</h1>
          <p className="text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "visit" : "visits"} match.
          </p>
        </div>
        <ExportCsvButton
          rows={csvRows}
          filename={`custom-report-${from}-${to}`}
        />
      </div>
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
      {filtered.length === 0 ? (
        <div className="border py-12 text-center text-sm text-muted-foreground">
          No visits match these filters.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Token</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Diagnosis</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.date}</TableCell>
                <TableCell>{r.tokenNumber}</TableCell>
                <TableCell>
                  <span className="font-medium">{r.patient.name}</span>
                </TableCell>
                <TableCell>{r.doctor.user.name}</TableCell>
                <TableCell>
                  <StatusBadge status={r.status} />
                </TableCell>
                <TableCell>{r.consultation?.diagnosis ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      )}
    </main>
  );
}
