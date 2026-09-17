import { z } from "zod";
import { medicineForms } from "@/lib/options";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v === "" ? undefined : v));

export const medicineSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  genericName: optionalText(255),
  form: z.enum(medicineForms).optional(),
  defaultDosageNote: optionalText(1000),
  status: z.enum(["active", "inactive"]),
});

export const medicineUpdateSchema = medicineSchema.partial().extend({
  id: z.number().int().positive(),
});

export const medicineStatusSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(["active", "inactive"]),
});

export type MedicineInput = z.infer<typeof medicineSchema>;
// Form type: with optional+transform fields, the input shape differs from
// the output shape — RHF must be typed with the input.
export type MedicineFormValues = z.input<typeof medicineSchema>;
