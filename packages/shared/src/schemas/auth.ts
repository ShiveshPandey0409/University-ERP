import { z } from "zod";
import { userTypeSchema } from "../enums/user-type.js";
import { authUserSchema } from "./user.js";

export const loginRequestSchema = z.object({
  loginType: userTypeSchema,
  username: z.string().min(1),
  password: z.string().min(1),
  captchaToken: z.string().optional(),
  otpCode: z.string().optional(),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

// Refresh token is delivered as an httpOnly cookie, never in the body.
export const loginResponseSchema = z.object({
  user: authUserSchema,
  accessToken: z.string(),
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;

export const mfaRequiredResponseSchema = z.object({
  mfaRequired: z.literal(true),
  challengeId: z.string(),
});
export type MfaRequiredResponse = z.infer<typeof mfaRequiredResponseSchema>;

export const refreshResponseSchema = z.object({
  accessToken: z.string(),
});
export type RefreshResponse = z.infer<typeof refreshResponseSchema>;

export const sessionResponseSchema = z.object({
  user: authUserSchema,
});
export type SessionResponse = z.infer<typeof sessionResponseSchema>;

export const forgotPasswordSchema = z.object({
  loginType: userTypeSchema,
  username: z.string().min(1),
  captchaToken: z.string().optional(),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const sendOtpSchema = z.object({
  purpose: z.enum(["login", "applicant_registration", "phd_registration", "private_registration"]),
  key: z.string().min(1),
});
export type SendOtpInput = z.infer<typeof sendOtpSchema>;

export const verifyOtpSchema = z.object({
  purpose: z.enum(["login", "applicant_registration", "phd_registration", "private_registration"]),
  key: z.string().min(1),
  otpCode: z.string().min(4).max(8),
});
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
