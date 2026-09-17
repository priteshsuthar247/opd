import { z } from "zod";
import { bloodGroups } from "@/lib/options";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v === "" ? undefined : v));

export const patientSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  // Dedupe key across the clinic — validated client-side, unique in DB.
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(20)
    .regex(/^[+\d][\d\s-]*$/, "Digits, spaces, dashes and leading + only"),
  dob: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v === "" ? undefined : v))
    .refine((v) => v === undefined || !Number.isNaN(Date.parse(v)), {
      message: "Enter a valid date",
    }),
  gender: z.enum(["male", "female", "other"]).optional(),
  bloodGroup: z.enum(bloodGroups).optional(),
  address: optionalText(2000),
  emergencyContact: optionalText(20),
  status: z.enum(["active", "inactive"]),
});

export const patientUpdateSchema = patientSchema.partial().extend({
  id: z.number().int().positive(),
});

export const patientStatusSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(["active", "inactive"]),
});

export type PatientInput = z.infer<typeof patientSchema>;
export type PatientFormValues = z.input<typeof patientSchema>;
