import { z } from "zod";

// Exactly one of medicineId / freeTextName must be provided — the catalog
// pick or the free-text fallback, never neither, never both blank.
export const prescriptionItemSchema = z
  .object({
    consultationId: z.number().int().positive(),
    medicineId: z.number().int().positive().optional(),
    freeTextName: z
      .string()
      .trim()
      .max(255)
      .optional()
      .transform((v) => (v === "" ? undefined : v)),
    dosage: z.string().trim().min(1, "Dosage is required").max(100),
    frequency: z.string().trim().min(1, "Frequency is required").max(100),
    duration: z.string().trim().min(1, "Duration is required").max(100),
    instructions: z
      .string()
      .trim()
      .max(1000)
      .optional()
      .transform((v) => (v === "" ? undefined : v)),
  })
  .refine((d) => d.medicineId !== undefined || d.freeTextName !== undefined, {
    message: "Pick a medicine or type a name",
  });

export const prescriptionItemRemoveSchema = z.object({
  id: z.number().int().positive(),
});

export const finalizePrescriptionSchema = z.object({
  consultationId: z.number().int().positive(),
});

export type PrescriptionItemInput = z.infer<typeof prescriptionItemSchema>;
export type PrescriptionItemFormValues = z.input<typeof prescriptionItemSchema>;
