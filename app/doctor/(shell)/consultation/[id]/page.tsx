import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { doctors, medicines } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  getConsultationBundle,
  listPatientHistory,
} from "@/db/queries/clinical";
import { ConsultationForm } from "@/components/consultation/consultation-form";
import { CompleteVisitButton } from "@/components/consultation/complete-visit-button";
import { HistoryPanel } from "@/components/consultation/history-panel";
import { PrescriptionBuilder } from "@/components/consultation/prescription-builder";
import { StatusBadge } from "@/components/queue/status-badge";
import { Button } from "@/components/ui/button";

export default async function ConsultationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "doctor") redirect("/");
  const doctor = await db.query.doctors.findFirst({
    where: eq(doctors.userId, Number(session.user.id)),
  });
  if (!doctor) redirect("/");

  const { id } = await params;
  const appointmentId = Number(id);
  if (!Number.isInteger(appointmentId)) redirect("/doctor/queue");

  const bundle = await getConsultationBundle(appointmentId);
  if (!bundle || bundle.doctorId !== doctor.id) redirect("/doctor/queue");

  const [history, meds] = await Promise.all([
    listPatientHistory(bundle.patientId, bundle.id),
    db.query.medicines.findMany({
      where: eq(medicines.status, "active"),
      orderBy: (t, { asc }) => [asc(t.name)],
    }),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">
            Token {bundle.tokenNumber} · {bundle.patient.name}
          </h1>
          <p className="text-xs text-muted-foreground">
            {bundle.patient.phone} · {bundle.date} ·{" "}
            {bundle.type === "walk_in" ? "Walk-in" : "Scheduled"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={bundle.status} />
          {bundle.consultation?.prescription && (
            <Button
              variant="outline"
              size="sm"
              render={
                <Link href={`/doctor/consultation/${bundle.id}/print`}>
                  Print / PDF
                </Link>
              }
            />
          )}
          {bundle.status === "in_progress" && (
            <CompleteVisitButton appointmentId={bundle.id} />
          )}
        </div>
      </div>
      {bundle.status !== "in_progress" ? (
        <div className="border p-4 text-sm text-muted-foreground">
          This visit is {bundle.status}. Consultations can only be recorded
          while the token is in progress.
        </div>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-4">
            <ConsultationForm bundle={bundle} />
            <PrescriptionBuilder
              consultation={bundle.consultation}
              medicines={meds}
            />
          </div>
          <HistoryPanel history={history} />
        </div>
      )}
    </main>
  );
}
