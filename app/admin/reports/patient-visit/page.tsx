import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/roles";
import { db } from "@/db";
import { patients } from "@/db/schema";
import { ExportCsvButton } from "@/components/admin/export-csv-button";
import { ReportPatientPicker } from "@/components/admin/report-patient-picker";
import { StatusBadge } from "@/components/queue/status-badge";

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
      })
    : null;
  const visits = patient
    ? await db.query.appointments.findMany({
        where: (t, { eq }) => eq(t.patientId, patient.id),
        with: {
          doctor: { with: { user: true } },
          consultation: {
            with: {
              prescription: { with: { items: { with: { medicine: true } } } },
            },
          },
          invoice: true,
        },
        orderBy: (t, { desc }) => [desc(t.date), desc(t.tokenNumber)],
      })
    : [];

  const csvRows = visits.map((v) => ({
    Date: v.date,
    Token: v.tokenNumber,
    Doctor: v.doctor.user.name,
    Status: v.status,
    Complaint: v.consultation?.chiefComplaint ?? "",
    Diagnosis: v.consultation?.diagnosis ?? "",
    Medicines:
      v.consultation?.prescription?.items
        .map(
          (i) =>
            `${i.medicine?.name ?? i.freeTextName ?? "—"} ${i.dosage} ${i.frequency} × ${i.duration}`
        )
        .join("; ") ?? "",
    "Follow-up": v.consultation?.followUpDate ?? "",
    "Total (₹)": v.invoice ? Number(v.invoice.totalAmount).toFixed(2) : "",
    "Payment": v.invoice?.paymentStatus ?? "",
  }));

  return (
    <main className="w-full px-4 lg:px-6 py-4 md:py-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">Patient Visit Report</h1>
          <p className="text-xs text-muted-foreground">
            {patient
              ? `${patient.name} · ${patient.phone} · ${visits.length} visit${visits.length === 1 ? "" : "s"}`
              : "Pick a patient to see the full history."}
          </p>
        </div>
        {patient && (
          <ExportCsvButton
            rows={csvRows}
            filename={`patient-${patient.id}-visits`}
          />
        )}
      </div>
      <div className="mb-4">
        <ReportPatientPicker />
      </div>
      {patient && visits.length === 0 && (
        <div className="border py-12 text-center text-sm text-muted-foreground">
          No visits recorded for this patient.
        </div>
      )}
      {patient && (
        <div className="flex flex-col gap-3">
          {visits.map((v) => (
            <div key={v.id} className="border p-3 text-xs">
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">
                  {v.date} · Token {v.tokenNumber} · {v.doctor.user.name}
                </span>
                <StatusBadge status={v.status} />
              </div>
              {v.consultation ? (
                <dl className="flex flex-col gap-1 text-muted-foreground">
                  {v.consultation.chiefComplaint && (
                    <div>
                      <dt className="font-medium text-foreground">Complaint</dt>
                      <dd>{v.consultation.chiefComplaint}</dd>
                    </div>
                  )}
                  {v.consultation.diagnosis && (
                    <div>
                      <dt className="font-medium text-foreground">Diagnosis</dt>
                      <dd>{v.consultation.diagnosis}</dd>
                    </div>
                  )}
                  {v.consultation.prescription &&
                    v.consultation.prescription.items.length > 0 && (
                      <div>
                        <dt className="font-medium text-foreground">
                          Medicines ({v.consultation.prescription.status})
                        </dt>
                        <dd>
                          {v.consultation.prescription.items
                            .map(
                              (i) =>
                                `${i.medicine?.name ?? i.freeTextName ?? "—"} ${i.dosage} ${i.frequency} × ${i.duration}`
                            )
                            .join("; ")}
                        </dd>
                      </div>
                    )}
                </dl>
              ) : (
                <p className="text-muted-foreground">No consultation recorded.</p>
              )}
              {v.invoice && (
                <p className="mt-1 text-muted-foreground">
                  Billed ₹{Number(v.invoice.totalAmount).toFixed(2)} ·{" "}
                  {v.invoice.paymentStatus}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
