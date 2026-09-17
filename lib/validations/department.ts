import { z } from "zod";

export const departmentSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  code: z
    .string()
    .trim()
    .min(1, "Code is required")
    .max(50)
    .regex(/^[A-Za-z0-9_-]+$/, "Letters, numbers, dash and underscore only"),
  status: z.enum(["active", "inactive"]),
});

export const departmentUpdateSchema = departmentSchema.partial().extend({
  id: z.number().int().positive(),
});

export const departmentStatusSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(["active", "inactive"]),
});

export type DepartmentInput = z.infer<typeof departmentSchema>;
export type DepartmentUpdateInput = z.infer<typeof departmentUpdateSchema>;
