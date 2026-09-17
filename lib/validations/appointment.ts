import { z } from "zod";

function todayStr(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export const appointmentSchema = z.object({
  patientId: z.number().int().positive("Pick a patient"),
  doctorId: z.number().int().positive("Pick a doctor"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format")
    .refine((d) => d >= todayStr(), "Date cannot be in the past"),
  type: z.enum(["walk_in", "scheduled"]),
});

export const appointmentRescheduleSchema = z.object({
  id: z.number().int().positive(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format")
    .refine((d) => d >= todayStr(), "Date cannot be in the past"),
});

export const appointmentCancelSchema = z.object({
  id: z.number().int().positive(),
});

export type AppointmentInput = z.infer<typeof appointmentSchema>;
export type AppointmentFormValues = z.input<typeof appointmentSchema>;
