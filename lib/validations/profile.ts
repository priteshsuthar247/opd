import { z } from "zod";
import { usernameSchema } from "@/lib/validations/user";

export const profileNameSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
});

export type ProfileNameInput = z.infer<typeof profileNameSchema>;

export const profileUsernameSchema = z.object({
  username: usernameSchema,
});

export type ProfileUsernameInput = z.infer<typeof profileUsernameSchema>;

export const avatarColorSchema = z.object({
  avatarColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Pick one of the swatches"),
});

export type AvatarColorInput = z.infer<typeof avatarColorSchema>;

export const emailChangeRequestSchema = z.object({
  email: z.email("Enter a valid email address"),
});

export type EmailChangeRequestInput = z.infer<typeof emailChangeRequestSchema>;

export const emailChangeConfirmSchema = z.object({
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export type EmailChangeConfirmInput = z.infer<typeof emailChangeConfirmSchema>;

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Minimum 8 characters"),
    confirmPassword: z.string().min(1, "Confirm the new password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
