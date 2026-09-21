import { redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { medicines } from "@/db/schema";
import {
  getConsultationBundle,
  listPatientHistory,
} from "@/db/queries/clinical";
import { ConsultationForm } from "@/components/consultation/consultation-form";
import { HistoryPanel } from "@/components/consultation/history-panel";
import { PrescriptionBuilder } from "@/components/consultation/prescription-builder";
import { Button } from "@/components/ui/button";

// Streaming sections for the consultation page: the page shell (header +
// status gate) paints from a light appointment query while these stream
// in behind their own skeletons. Form/Rx owns the heavy bundle fetch;
// history streams as a sibling so neither blocks the other.

// Consultation form + prescription builder (needs the 4-level bundle
// join). Redirects on ownership mismatch (doctor guessing another
// doctor's appointment id).
export async function ConsultationWorkspace({
  appointmentId,
  doctorId,
}: {
  appointmentId: number;
  doctorId: number;
}) {
  const [bundle, meds] = await Promise.all([
    getConsultationBundle(appointmentId),
    db.query.medicines.findMany({
      where: eq(medicines.status, "active"),
      orderBy: (t, { asc }) => [asc(t.name)],
    }),
  ]);
  if (!bundle || bundle.doctorId !== doctorId) redirect("/doctor/queue");

  return (
    <div className="flex flex-col gap-4">
      {bundle.consultation?.prescription && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            render={
              <Link href={`/doctor/consultation/${bundle.id}/print`}>
                Print / PDF
              </Link>
            }
          />
        </div>
      )}
      <ConsultationForm bundle={bundle} />
      <PrescriptionBuilder
        consultation={bundle.consultation}
        medicines={meds}
      />
    </div>
  );
}

// Patient history (sidebar column). Independent query, own boundary.
export async function HistorySection({
  appointmentId,
  patientId,
}: {
  appointmentId: number;
  patientId: number;
}) {
  const history = await listPatientHistory(patientId, appointmentId);
  return <HistoryPanel history={history} />;
}
