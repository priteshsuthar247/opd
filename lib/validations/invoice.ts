import { z } from "zod";

const money = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount (e.g. 150 or 150.50)");

export const invoiceItemAddSchema = z.object({
  appointmentId: z.number().int().positive(),
  billingItemId: z.number().int().positive(),
});

export const invoiceItemRemoveSchema = z.object({
  id: z.number().int().positive(),
});

// Totals always recompute server-side: fee + items − discount (min 0).
// paidAt is stamped when status flips to paid, cleared back to pending.
export const invoiceUpdateSchema = z.object({
  appointmentId: z.number().int().positive(),
  discount: money.default("0"),
  paymentStatus: z.enum(["pending", "paid"]),
  paymentMode: z
    .string()
    .trim()
    .max(50)
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
});

export type InvoiceUpdateInput = z.infer<typeof invoiceUpdateSchema>;
export type InvoiceUpdateFormValues = z.input<typeof invoiceUpdateSchema>;
