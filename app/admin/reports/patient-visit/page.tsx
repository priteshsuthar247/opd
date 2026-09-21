import { Suspense } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/roles";
import { db } from "@/db";
import { patients } from "@/db/schema";
import { listPatients } from "@/db/queries/patients";
import { ReportPatientPicker } from "@/components/admin/report-patient-picker";
import { PatientPickerTable } from "@/components/admin/patient-picker-table";
import { PatientVisitsSection } from "@/components/admin/patient-visits-section";
import { TableSkeleton } from "@/components/shell/loading-blocks";

export default async function PatientVisitPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string }>;
}) {
  if (!(await requireRole("admin"))) redirect("/");
  const params = await searchParams;
  const patientId =
    params.patientId && /^\d+$/.test(params.patientId)
      ? Number(params.patientId)
      : undefined;

  const patient = patientId
    ? await db.query.patients.findFirst({
        where: eq(patients.id, patientId),
        columns: { id: true, name: true, phone: true },
      })
    : null;
  // No selection: browse the registry instead of an empty page.
  const browser = !patient ? await listPatients() : null;

  return (
    <main className="w-full px-4 lg:px-6 py-4 md:py-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">Patient Visit Report</h1>
          <p className="text-xs text-muted-foreground">
            {patient
              ? `${patient.name} · ${patient.phone}`
              : "Browse or search patients…"}
          </p>
        </div>
      </div>
      {patient ? (
        <>
          <div className="mb-4">
            <ReportPatientPicker />
          </div>
          <Suspense fallback={<TableSkeleton rows={6} />}>
            <PatientVisitsSection patientId={patient.id} />
          </Suspense>
        </>
      ) : (
        browser && <PatientPickerTable data={browser} />
      )}
    </main>
  );
}
