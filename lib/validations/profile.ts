import { z } from "zod";

export const profileNameSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
});

export type ProfileNameInput = z.infer<typeof profileNameSchema>;

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
