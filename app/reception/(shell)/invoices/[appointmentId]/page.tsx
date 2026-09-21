import { Suspense } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/roles";
import { db } from "@/db";
import { appointments } from "@/db/schema";
import { InvoiceSection } from "@/components/reception/invoice-section";
import { DownloadInvoiceButton } from "@/components/billing/download-invoice-button";
import { FormSkeleton } from "@/components/shell/loading-blocks";

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  if (!(await requireRole("receptionist", "admin"))) redirect("/");
  const { appointmentId } = await params;
  const id = Number(appointmentId);
  if (!Number.isInteger(id)) redirect("/reception/queue");

  // Token number for the download filename (light PK lookup; the full
  // bundle streams inside the section below).
  const header = await db.query.appointments.findFirst({
    where: eq(appointments.id, id),
    columns: { tokenNumber: true },
  });

  return (
    <main className="mx-auto w-full max-w-3xl p-4">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold">Invoice</h1>
          <p className="text-xs text-muted-foreground">
            Appointment #{id}
          </p>
        </div>
        <DownloadInvoiceButton
          appointmentId={id}
          tokenNumber={header?.tokenNumber ?? 0}
        />
      </div>
      <Suspense fallback={<FormSkeleton fields={6} />}>
        <InvoiceSection id={id} />
      </Suspense>
    </main>
  );
}
