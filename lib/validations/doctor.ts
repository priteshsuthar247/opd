import { z } from "zod";

const money = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid fee (e.g. 500 or 500.50)");

const hhmm = /^([01]\d|2[0-3]):[0-5]\d$/;

// Day rows are { start, end } in the form (blank = off). Fields accept
// missing/blank input because RHF submits the *validated output* back
// through this same schema server-side — after the first pass the blanks
// are already undefined, so the input shape must tolerate that too.
const dayHours = z
  .object({ start: z.string().optional(), end: z.string().optional() })
  .transform((d) => ({
    start: d.start?.trim() ? d.start.trim() : undefined,
    end: d.end?.trim() ? d.end.trim() : undefined,
  }))
  .refine((d) => (d.start === undefined) === (d.end === undefined), {
    message: "Set both start and end, or leave the day off",
  })
  .refine(
    (d) =>
      (d.start === undefined || hhmm.test(d.start)) &&
      (d.end === undefined || hhmm.test(d.end)),
    { message: "Use HH:MM format" }
  );

const workingHoursSchema = z.object({
  mon: dayHours,
  tue: dayHours,
  wed: dayHours,
  thu: dayHours,
  fri: dayHours,
  sat: dayHours,
  sun: dayHours,
});

const profileFields = {
  departmentId: z.number().int().positive("Pick a department"),
  qualification: z.string().trim().max(255).optional().transform((v) => (v === "" ? undefined : v)),
  registrationNo: z.string().trim().max(100).optional().transform((v) => (v === "" ? undefined : v)),
  consultationFee: money,
  workingHours: workingHoursSchema,
  status: z.enum(["active", "inactive"]),
};

export const doctorSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Minimum 8 characters"),
  ...profileFields,
});

// Edit mode: same fields, but an empty password means "keep current".
// The id lives on the action payload, not in the form.
export const doctorEditSchema = doctorSchema.extend({
  password: z
    .string()
    .optional()
    .transform((v) => (v === "" ? undefined : v))
    .refine((v) => v === undefined || v.length >= 8, "Minimum 8 characters"),
});

export const doctorUpdateSchema = doctorEditSchema.extend({
  id: z.number().int().positive(),
});

export const doctorStatusSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(["active", "inactive"]),
});

export type DoctorInput = z.infer<typeof doctorSchema>;
export type DoctorFormValues = z.input<typeof doctorEditSchema>;
