import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  password: z.string().min(8),
  workspaceName: z.string().trim().min(2),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(10),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(20),
});

export const inviteAcceptSchema = z.object({
  token: z.string().min(10),
  name: z.string().trim().min(2),
  password: z.string().min(8),
});

export const resendVerificationSchema = z.object({
  email: z.string().trim().email(),
});

