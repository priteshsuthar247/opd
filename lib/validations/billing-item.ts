import { z } from "zod";

const money = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount (e.g. 150 or 150.50)");

export const billingItemSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  type: z.string().trim().max(100).optional().transform((v) => (v === "" ? undefined : v)),
  amount: money,
  status: z.enum(["active", "inactive"]),
});

export const billingItemUpdateSchema = billingItemSchema.partial().extend({
  id: z.number().int().positive(),
});

export const billingItemStatusSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(["active", "inactive"]),
});

export type BillingItemInput = z.infer<typeof billingItemSchema>;
// Form type: with optional+transform fields, the input shape differs from
// the output shape — RHF must be typed with the input.
export type BillingItemFormValues = z.input<typeof billingItemSchema>;
