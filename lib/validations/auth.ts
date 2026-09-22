import { z } from "zod";

export const loginSchema = z.object({
  // Username or email — the @ decides the lookup column in authorize.
  identifier: z.string().trim().min(1, "Enter your username or email"),
  password: z.string().min(1, "Password is required"),
  // Second factor, only sent when the server asked for it.
  totpCode: z.string().trim().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
