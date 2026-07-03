import { z } from "zod";

export const ForgotPasswordInputSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordInputSchema>;

export const ResetPasswordInputSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(6, "New password must be at least 6 characters long"),
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordInputSchema>;

export const UpdateProfileInputSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileInputSchema>;

export const ChangePasswordInputSchema = z.object({
  oldPassword: z.string().min(1, "Old password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters long"),
});

export type ChangePasswordInput = z.infer<typeof ChangePasswordInputSchema>;

export const VerifyEmailInputSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

export type VerifyEmailInput = z.infer<typeof VerifyEmailInputSchema>;
