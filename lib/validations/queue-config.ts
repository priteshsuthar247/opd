import { z } from "zod";

const configFields = {
  doctorId: z.number().int().positive("Pick a doctor"),
  slotDurationMinutes: z.coerce
    .number()
    .int("Whole minutes only")
    .min(1, "At least 1 minute")
    .max(480, "At most 480 minutes"),
  maxTokensPerDay: z.coerce
    .number()
    .int("Whole tokens only")
    .min(1, "At least 1 token")
    .max(500, "At most 500 tokens"),
  status: z.enum(["active", "inactive"]),
};

export const queueConfigSchema = z.object(configFields);

// Doctor assignment is immutable after creation — it scopes tokens and
// logs — so the update schema carries every field except doctorId.
export const queueConfigUpdateSchema = z.object({
  id: z.number().int().positive(),
  slotDurationMinutes: configFields.slotDurationMinutes,
  maxTokensPerDay: configFields.maxTokensPerDay,
  status: configFields.status,
});

export const queueConfigStatusSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(["active", "inactive"]),
});

export type QueueConfigInput = z.infer<typeof queueConfigSchema>;
export type QueueConfigFormValues = z.input<typeof queueConfigSchema>;
