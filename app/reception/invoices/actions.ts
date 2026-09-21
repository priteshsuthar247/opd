"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  billingItems,
  invoiceItems,
  invoices,
} from "@/db/schema";
import { requireRole } from "@/lib/roles";
import { getInvoiceBundle } from "@/db/queries/invoices";
import {
  invoiceItemAddSchema,
  invoiceItemRemoveSchema,
  invoiceUpdateSchema,
} from "@/lib/validations/invoice";

export type ActionResult = { ok: true } | { ok: false; error: string };

// Dialog data source: serializable bundle plus active billing master.
export async function getInvoiceData(appointmentId: number) {
  if (!(await requireRole("receptionist", "admin"))) return null;
  if (!Number.isInteger(appointmentId)) return null;
  const [bundle, master] = await Promise.all([
    getInvoiceBundle(appointmentId),
    db.query.billingItems.findMany({
      where: eq(billingItems.status, "active"),
      orderBy: (t, { asc }) => [asc(t.name)],
    }),
  ]);
  if (!bundle) return null;
  return {
    bundle: {
      ...bundle,
      invoice: bundle.invoice
        ? {
            ...bundle.invoice,
            paidAt: bundle.invoice.paidAt?.toISOString() ?? null,
            createdAt: bundle.invoice.createdAt.toISOString(),
          }
        : null,
    },
    master,
  };
}

function invalid(): ActionResult {
  return { ok: false, error: "Invalid input." };
}

async function recompute(
  tx: Tx,
  invoiceId: number,
  discount: string
): Promise<void> {
  const [invoice, items] = await Promise.all([
    tx.query.invoices.findFirst({
      where: eq(invoices.id, invoiceId),
    }),
    tx.query.invoiceItems.findMany({
      where: eq(invoiceItems.invoiceId, invoiceId),
    }),
  ]);
  if (!invoice) throw new Error("Invoice not found.");
  // Integer paise throughout: numeric(10,2) arrives as decimal strings
  // and Number() float math rounds wrong on money (e.g. 0.1 + 0.2).
  const toPaise = (v: string) => Math.round(Number(v) * 100);
  const fee = toPaise(invoice.consultationFee);
  const extras = items.reduce((s, i) => s + toPaise(i.amount), 0);
  const total = Math.max(0, fee + extras - toPaise(discount));
  await tx
    .update(invoices)
    .set({ discount, totalAmount: (total / 100).toFixed(2) })
    .where(eq(invoices.id, invoiceId));
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function addInvoiceItem(input: unknown): Promise<ActionResult> {
  if (!(await requireRole("receptionist", "admin")))
    return { ok: false, error: "Not authorized." };
  const parsed = invoiceItemAddSchema.safeParse(input);
  if (!parsed.success) return invalid();

  try {
    await db.transaction(async (tx) => {
      const invoice = await tx.query.invoices.findFirst({
        where: eq(invoices.appointmentId, parsed.data.appointmentId),
      });
      if (!invoice) throw new Error("Invoice not found.");
      const master = await tx.query.billingItems.findFirst({
        where: eq(billingItems.id, parsed.data.billingItemId),
      });
      if (!master || master.status !== "active")
        throw new Error("Billing item is not available.");
      // Snapshot name+amount: later master edits must not rewrite history.
      await tx.insert(invoiceItems).values({
        invoiceId: invoice.id,
        billingItemId: master.id,
        name: master.name,
        amount: master.amount,
      });
      await recompute(tx, invoice.id, invoice.discount);
    });
  } catch (err) {
    if (err instanceof Error) return { ok: false, error: err.message };
    return { ok: false, error: "Could not add the billing item." };
  }
  revalidatePath(`/reception/invoices/${parsed.data.appointmentId}`);
  return { ok: true };
}

export async function removeInvoiceItem(
  input: unknown
): Promise<ActionResult> {
  if (!(await requireRole("receptionist", "admin")))
    return { ok: false, error: "Not authorized." };
  const parsed = invoiceItemRemoveSchema.safeParse(input);
  if (!parsed.success) return invalid();

  try {
    await db.transaction(async (tx) => {
      const item = await tx.query.invoiceItems.findFirst({
        where: eq(invoiceItems.id, parsed.data.id),
      });
      if (!item) throw new Error("Item not found.");
      const invoice = await tx.query.invoices.findFirst({
        where: eq(invoices.id, item.invoiceId),
      });
      if (!invoice) throw new Error("Invoice not found.");
      await tx.delete(invoiceItems).where(eq(invoiceItems.id, item.id));
      await recompute(tx, invoice.id, invoice.discount);
    });
  } catch (err) {
    if (err instanceof Error) return { ok: false, error: err.message };
    return { ok: false, error: "Could not remove the billing item." };
  }
  return { ok: true };
}

export async function updateInvoice(input: unknown): Promise<ActionResult> {
  if (!(await requireRole("receptionist", "admin")))
    return { ok: false, error: "Not authorized." };
  const parsed = invoiceUpdateSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  try {
    await db.transaction(async (tx) => {
      const invoice = await tx.query.invoices.findFirst({
        where: eq(invoices.appointmentId, parsed.data.appointmentId),
      });
      if (!invoice) throw new Error("Invoice not found.");
      const wasPaid = invoice.paymentStatus === "paid";
      const nowPaid = parsed.data.paymentStatus === "paid";
      await tx
        .update(invoices)
        .set({
          paymentStatus: parsed.data.paymentStatus,
          paymentMode: nowPaid ? (parsed.data.paymentMode ?? null) : null,
          paidAt: nowPaid ? (wasPaid ? invoice.paidAt : new Date()) : null,
        })
        .where(eq(invoices.id, invoice.id));
      await recompute(tx, invoice.id, parsed.data.discount);
    });
  } catch (err) {
    if (err instanceof Error) return { ok: false, error: err.message };
    return { ok: false, error: "Could not update the invoice." };
  }
  revalidatePath(`/reception/invoices/${parsed.data.appointmentId}`);
  return { ok: true };
}
