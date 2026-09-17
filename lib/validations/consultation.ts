import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v === "" ? undefined : v));

// Blank inputs must stay blank: coerce turns "" into 0, which would fail
// the ranges below. The preprocess keeps empty as undefined.
const optionalNum = (schema: z.ZodType<number>) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    schema.optional()
  );

export const vitalsSchema = z.object({
  bp: optionalText(20),
  tempC: optionalNum(z.coerce.number().min(25).max(45)),
  pulse: optionalNum(z.coerce.number().int().min(20).max(250)),
  weightKg: optionalNum(z.coerce.number().min(0).max(500)),
});

export const consultationSchema = z.object({
  appointmentId: z.number().int().positive(),
  // Absent vitals object defaults to empty (prefault, not default: the
  // input side is partial-optional and default({}) mistypes against it).
  vitals: vitalsSchema.prefault({}),
  chiefComplaint: optionalText(2000),
  diagnosis: optionalText(2000),
  notes: optionalText(4000),
  followUpRequired: z.boolean().default(false),
  followUpDate: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v === "" ? undefined : v))
    .refine((v) => v === undefined || /^\d{4}-\d{2}-\d{2}$/.test(v), {
      message: "Use YYYY-MM-DD format",
    }),
});

export type ConsultationInput = z.infer<typeof consultationSchema>;
export type ConsultationFormValues = z.input<typeof consultationSchema>;

export const completeVisitSchema = z.object({
  appointmentId: z.number().int().positive(),
});
