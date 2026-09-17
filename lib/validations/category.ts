import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  type: z.enum(["diagnosis", "symptom", "complaint"]),
  status: z.enum(["active", "inactive"]),
});

export const categoryUpdateSchema = categorySchema.partial().extend({
  id: z.number().int().positive(),
});

export const categoryStatusSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(["active", "inactive"]),
});

export type CategoryInput = z.infer<typeof categorySchema>;
