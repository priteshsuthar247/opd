import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireRole } from "@/lib/roles";
import { InvoiceSection } from "@/components/reception/invoice-section";
import { Button } from "@/components/ui/button";
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

  return (
    <main className="mx-auto w-full max-w-3xl p-4">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold">Invoice</h1>
          <p className="text-xs text-muted-foreground">
            Appointment #{id}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={
            <Link href={`/reception/invoices/${id}/print`}>
              Print / PDF
            </Link>
          }
        />
      </div>
      <Suspense fallback={<FormSkeleton fields={6} />}>
        <InvoiceSection id={id} />
      </Suspense>
    </main>
  );
}
