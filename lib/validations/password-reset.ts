import { z } from "zod";

export const resetRequestSchema = z.object({
  // Username or email — same @-rule as login.
  identifier: z.string().trim().min(1, "Enter your username or email"),
});

export const otpVerifySchema = z.object({
  identifier: z.string().trim().min(1, "Enter your username or email"),
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export const passwordResetSchema = z
  .object({
    // Opaque reset token minted by verifyOtp (never the OTP itself).
    resetToken: z.string().min(1, "Missing reset token"),
    password: z.string().min(8, "Minimum 8 characters"),
    confirmPassword: z.string().min(1, "Confirm the new password"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetRequestInput = z.infer<typeof resetRequestSchema>;
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
