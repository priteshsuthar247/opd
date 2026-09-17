import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/roles";
import { db } from "@/db";
import { billingItems } from "@/db/schema";
import { getInvoiceBundle } from "@/db/queries/invoices";
import { InvoiceManager } from "@/components/reception/invoice-manager";

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
    <main className="w-full px-4 lg:px-6 py-4 md:py-6">
      <div className="mb-4">
        <h1 className="text-lg font-semibold">Invoice</h1>
        <p className="text-xs text-muted-foreground">
          Appointment #{bundle.id} · {bundle.date}
        </p>
      </div>
      <InvoiceManager bundle={bundle} masterItems={master} />
    </main>
  );
}
