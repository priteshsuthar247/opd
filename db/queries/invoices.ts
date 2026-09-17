import { eq } from "drizzle-orm";
import { db } from "@/db";
import { invoices } from "@/db/schema";

export function getInvoiceBundle(appointmentId: number) {
  return db.query.appointments.findFirst({
    where: (t, { eq }) => eq(t.id, appointmentId),
    with: {
      patient: true,
      doctor: { with: { user: true, department: true } },
      invoice: { with: { items: { with: { billingItem: true } } } },
    },
  });
}

export type InvoiceBundle = Awaited<ReturnType<typeof getInvoiceBundle>>;

export function findInvoiceByAppointment(appointmentId: number) {
  return db.query.invoices.findFirst({
    where: eq(invoices.appointmentId, appointmentId),
  });
}
