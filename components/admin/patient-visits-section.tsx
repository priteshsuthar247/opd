import { db } from "@/db";
import { StatusBadge } from "@/components/queue/status-badge";
import {
  PaymentBadge,
  PrescriptionBadge,
} from "@/components/billing/status-badges";
import { ExportCsvButton } from "@/components/admin/export-csv-button";
import { DownloadReportButton } from "@/components/reports/download-report-button";

// Streaming visit history for the patient-visit report: the patient
// header + picker paint from a PK lookup while the full history (with
// consultation, prescription, and invoice relations) streams here.
export async function PatientVisitsSection({
  patientId,
}: {
  patientId: number;
}) {
  const visits = await db.query.appointments.findMany({
    where: (t, { eq }) => eq(t.patientId, patientId),
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
  });

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

  if (visits.length === 0) {
    return (
      <div className="border py-12 text-center text-sm text-muted-foreground">
        No visits recorded for this patient.
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex justify-end gap-2">
        <ExportCsvButton
          rows={csvRows}
          filename={`patient-${patientId}-visits`}
        />
        <DownloadReportButton
          query={`report=visits&patientId=${patientId}`}
          filename={`patient-${patientId}-visits`}
        />
      </div>
      {/* Timeline: fixed status rail on the left, clinical narrative
      then financial line grouped on the right. Cancelled and no-show
      visits collapse to one line — they carry no clinical content. */}
      <ol className="flex flex-col gap-3">
        {visits.map((v) => (
          <li key={v.id} className="flex gap-3">
            <div className="flex w-28 shrink-0 flex-col gap-1">
              <StatusBadge status={v.status} />
              <span className="text-xs text-muted-foreground">{v.date}</span>
              <span className="text-xs text-muted-foreground">
                Token {v.tokenNumber} · {v.doctor.user.name}
              </span>
            </div>
            <div className="min-w-0 flex-1 border p-3 text-xs">
              {v.status === "cancelled" || v.status === "no_show" ? (
                <p className="text-muted-foreground">
                  {v.status === "cancelled"
                    ? "Appointment cancelled."
                    : "Patient did not show up."}
                </p>
              ) : (
                <>
                  {v.consultation ? (
                    <dl className="flex flex-col gap-2">
                      {v.consultation.chiefComplaint && (
                        <div>
                          <dt className="font-medium text-foreground">
                            Complaint
                          </dt>
                          <dd className="text-muted-foreground">
                            {v.consultation.chiefComplaint}
                          </dd>
                        </div>
                      )}
                      {v.consultation.diagnosis && (
                        <div>
                          <dt className="font-medium text-foreground">
                            Diagnosis
                          </dt>
                          <dd className="text-muted-foreground">
                            {v.consultation.diagnosis}
                          </dd>
                        </div>
                      )}
                      {v.consultation.prescription &&
                        v.consultation.prescription.items.length > 0 && (
                          <div>
                            <dt className="flex items-center gap-2 font-medium text-foreground">
                              Medicines{" "}
                              <PrescriptionBadge
                                status={v.consultation.prescription.status}
                              />
                            </dt>
                            <dd className="text-muted-foreground">
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
                    <p className="text-muted-foreground">
                      No consultation recorded.
                    </p>
                  )}
                  {v.invoice && (
                    <p className="mt-2 flex items-center gap-2 border-t pt-2 text-muted-foreground">
                      Billed ₹{Number(v.invoice.totalAmount).toFixed(2)} ·{" "}
                      <PaymentBadge status={v.invoice.paymentStatus} />
                    </p>
                  )}
                </>
              )}
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
