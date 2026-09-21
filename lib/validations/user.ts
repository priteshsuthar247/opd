import { z } from "zod";

// Social-style handle: lowercase letters, numbers, dots, underscores,
// hyphens. 3–30 chars. Shared by the doctor dialog, the availability
// check, and user creation — one definition, zero drift.
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Minimum 3 characters")
  .max(30, "Maximum 30 characters")
  .regex(
    /^[a-z0-9._-]+$/,
    "Only letters, numbers, dots, underscores and hyphens"
  )
  .refine((v) => !/^[._-]|[._-]$/.test(v), {
    message: "Cannot start or end with . _ or -",
  });

export type Username = z.infer<typeof usernameSchema>;
