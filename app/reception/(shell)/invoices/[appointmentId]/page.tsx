import { redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/roles";
import { db } from "@/db";
import { billingItems } from "@/db/schema";
import { getInvoiceBundle } from "@/db/queries/invoices";
import { InvoiceManager } from "@/components/reception/invoice-manager";
import { Button } from "@/components/ui/button";

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  if (!(await requireRole("receptionist", "admin"))) redirect("/");
  const { appointmentId } = await params;
  const id = Number(appointmentId);
  if (!Number.isInteger(id)) redirect("/reception/queue");

  const [bundle, master] = await Promise.all([
    getInvoiceBundle(id),
    db.query.billingItems.findMany({
      where: eq(billingItems.status, "active"),
      orderBy: (t, { asc }) => [asc(t.name)],
    }),
  ]);
  if (!bundle) redirect("/reception/queue");

  return (
    <main className="mx-auto w-full max-w-3xl p-4">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold">Invoice</h1>
          <p className="text-xs text-muted-foreground">
            Appointment #{bundle.id} · {bundle.date}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={
            <Link href={`/reception/invoices/${bundle.id}/print`}>
              Print / PDF
            </Link>
          }
        />
      </div>
      <InvoiceManager bundle={bundle} masterItems={master} />
    </main>
  );
}
