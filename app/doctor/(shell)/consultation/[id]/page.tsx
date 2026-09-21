import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { appointments, doctors } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  ConsultationWorkspace,
  HistorySection,
} from "@/components/consultation/consultation-sections";
import { CompleteVisitButton } from "@/components/consultation/complete-visit-button";
import { DownloadPdfButton } from "@/components/prescription/download-pdf-button";
import { StatusBadge } from "@/components/queue/status-badge";
import { Button } from "@/components/ui/button";
import {
  FormSkeleton,
  TableSkeleton,
} from "@/components/shell/loading-blocks";

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

  // Light header query (primary key + patient name): paints the shell
  // immediately while the heavy bundle, history, and form stream below.
  // Includes prescription existence so completed visits (the ones doctors
  // actually print) get their download button without the bundle join.
  const header = await db.query.appointments.findFirst({
    where: eq(appointments.id, appointmentId),
    columns: {
      id: true,
      tokenNumber: true,
      status: true,
      date: true,
      type: true,
      patientId: true,
      doctorId: true,
    },
    with: {
      patient: { columns: { name: true, phone: true } },
      consultation: {
        columns: { id: true },
        with: { prescription: { columns: { id: true } } },
      },
    },
  });
  if (!header || header.doctorId !== doctor.id) redirect("/doctor/queue");

  return (
    <main className="w-full px-4 lg:px-6 py-4 md:py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">
            Token {header.tokenNumber} · {header.patient.name}
          </h1>
          <p className="text-xs text-muted-foreground">
            {header.patient.phone} · {header.date} ·{" "}
            {header.type === "walk_in" ? "Walk-in" : "Scheduled"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={header.status} />
          {header.status === "in_progress" && (
            <CompleteVisitButton
              appointmentId={header.id}
              tokenNumber={header.tokenNumber}
            />
          )}
        </div>
      </div>
      {header.status !== "in_progress" ? (
        <div className="flex flex-col gap-3">
          <div className="border p-4 text-sm text-muted-foreground">
            This visit is {header.status}. Consultations can only be recorded
            while the token is in progress.
          </div>
          {header.consultation?.prescription && (
            <div className="flex justify-end">
              <DownloadPdfButton
                appointmentId={header.id}
                tokenNumber={header.tokenNumber}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[1fr_320px]">
          <Suspense fallback={<FormSkeleton fields={6} />}>
            <ConsultationWorkspace
              appointmentId={header.id}
              doctorId={doctor.id}
            />
          </Suspense>
          <Suspense fallback={<TableSkeleton rows={5} />}>
            <HistorySection
              appointmentId={header.id}
              patientId={header.patientId}
            />
          </Suspense>
        </div>
      )}
    </main>
  );
}
