import { eq } from "drizzle-orm";
import { db } from "@/db";
import { billingItems } from "@/db/schema";
import { getInvoiceBundle } from "@/db/queries/invoices";
import { InvoiceManager } from "@/components/reception/invoice-manager";

// Streaming billing workspace for the invoice page: the header paints
// from params alone while the invoice bundle + billing masters load
// here behind a skeleton.
export async function InvoiceSection({ id }: { id: number }) {
  const [bundle, master] = await Promise.all([
    getInvoiceBundle(id),
    db.query.billingItems.findMany({
      where: eq(billingItems.status, "active"),
      orderBy: (t, { asc }) => [asc(t.name)],
    }),
  ]);
  if (!bundle) {
    return (
      <div className="border py-12 text-center text-sm text-muted-foreground">
        No invoice found for this appointment.
      </div>
    );
  }
  return <InvoiceManager bundle={bundle} masterItems={master} />;
}
