import { z } from "zod";

export const settingKeys = [
  "no_show_minutes",
  "no_show_token_gap",
  "auto_fee_enabled",
  "notifications",
] as const;

// Queue & no-show thresholds (Spec Section 8).
export const noShowSettingsSchema = z.object({
  minutes: z.coerce
    .number()
    .int("Whole minutes only")
    .min(1, "At least 1 minute")
    .max(480, "At most 8 hours"),
  gap: z.coerce
    .number()
    .int("Whole tokens only")
    .min(1, "At least 1 token")
    .max(50, "At most 50 tokens"),
});

export type NoShowSettingsInput = z.infer<typeof noShowSettingsSchema>;
export type NoShowSettingsFormValues = z.input<typeof noShowSettingsSchema>;

// Auto fee toggle (Spec Section 8).
export const autoFeeSettingsSchema = z.object({
  enabled: z.boolean(),
});

export type AutoFeeSettingsInput = z.infer<typeof autoFeeSettingsSchema>;

// Per-event in-app notification switches.
export const notificationSettingsSchema = z.object({
  appointment_booked: z.boolean(),
  turn_approaching: z.boolean(),
  prescription_finalized: z.boolean(),
  follow_up_due: z.boolean(),
});

export type NotificationSettingsInput = z.infer<
  typeof notificationSettingsSchema
>;
