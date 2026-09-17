import { z } from "zod";

export const settingKeys = [
  "no_show_minutes",
  "no_show_token_gap",
  "auto_fee_enabled",
  "notifications",
] as const;

export const settingDescriptions: Record<(typeof settingKeys)[number], string> =
  {
    no_show_minutes:
      "Minutes a waiting token may sit before auto-flagging no-show.",
    no_show_token_gap:
      "Token gap behind the live token before auto-flagging no-show.",
    auto_fee_enabled:
      "Auto-populate invoice consultation fee from the doctor's fee.",
    notifications:
      "Per-event in-app notification switches (appointment booked, turn approaching, prescription finalized, follow-up due).",
  };

export const settingSchema = z.object({
  key: z.enum(settingKeys),
  // JSON document edited as text; must parse to an object.
  valueJson: z
    .string()
    .trim()
    .min(1, "Value is required")
    .refine(
      (v) => {
        try {
          return typeof JSON.parse(v) === "object" && JSON.parse(v) !== null;
        } catch {
          return false;
        }
      },
      { message: "Must be a valid JSON object" }
    ),
});

export type SettingInput = z.infer<typeof settingSchema>;
