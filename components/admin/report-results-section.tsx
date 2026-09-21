import { listAppointmentsInRange } from "@/db/queries/reports";
import { ExportCsvButton } from "@/components/admin/export-csv-button";
import { ReportResultsTable } from "@/components/admin/report-results-table";

export type ReportFilters = {
  departmentId?: number;
  doctorId?: number;
  patientId?: number;
  from: string;
  to: string;
  status?: "waiting" | "in_progress" | "completed" | "cancelled" | "no_show";
  diagnosis?: string;
};

// Streaming results for the custom report: the filter bar (cheap master
// queries) paints first; the range bundle, match count, CSV export, and
// result grid stream behind a skeleton.
export async function ReportResultsSection({
  filters,
}: {
  filters: ReportFilters;
}) {
  const { departmentId, doctorId, patientId, from, to, status, diagnosis } =
    filters;
  const rows = await listAppointmentsInRange({ from, to });

  const filtered = rows.filter(
    (r) =>
      (departmentId === undefined ||
        r.doctor.departmentId === departmentId) &&
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
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">Custom Report</h1>
          <p className="text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "visit" : "visits"}{" "}
            match.
          </p>
        </div>
        <ExportCsvButton
          rows={csvRows}
          filename={`custom-report-${from}-${to}`}
        />
      </div>
      {filtered.length === 0 ? (
        <div className="border py-12 text-center text-sm text-muted-foreground">
          No visits match these filters.
        </div>
      ) : (
        <ReportResultsTable data={filtered} />
      )}
    </>
  );
}
