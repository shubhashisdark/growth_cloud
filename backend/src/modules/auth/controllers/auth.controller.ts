import type { Request, Response } from "express";

import { sendError, sendSuccess } from "../../../lib/response.js";
import { AuthService } from "../services/auth.service.js";
import { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, verifyEmailSchema, refreshTokenSchema, inviteAcceptSchema } from "../validators.js";
import { extractBearerToken } from "../../../lib/auth.js";
import { verifyAccessToken } from "../../../lib/auth.js";

export class AuthController {
  constructor(private readonly authService = new AuthService()) {}

  signup = async (request: Request, response: Response) => {
    const payload = signupSchema.parse(request.body);
    const result = await this.authService.signup(payload);
    if (result.error) {
      return sendError(response, result.error.code, result.error.message, result.status);
    }
    return sendSuccess(response, result.data, { status: "created" });
  };

  login = async (request: Request, response: Response) => {
    const payload = loginSchema.parse(request.body);
    const result = await this.authService.login(payload);
    if (result.error) {
      return sendError(response, result.error.code, result.error.message, result.status);
    }
    return sendSuccess(response, result.data);
  };

  refresh = async (request: Request, response: Response) => {
    const payload = refreshTokenSchema.parse(request.body);
    const result = await this.authService.refresh(payload.refreshToken);
    if (result.error) {
      return sendError(response, result.error.code, result.error.message, result.status);
    }
    return sendSuccess(response, result.data);
  };

  logout = async (request: Request, response: Response) => {
    const token = extractBearerToken(request.headers.authorization);
    if (!token) return sendError(response, "UNAUTHORIZED", "Authentication is required", 401);
    const verified = verifyAccessToken(token);
    if (!verified) return sendError(response, "UNAUTHORIZED", "Authentication is required", 401);
    const result = await this.authService.logout(verified.userId, verified.sessionId);
    return sendSuccess(response, result.data);
  };

  me = async (request: Request, response: Response) => {
    const token = extractBearerToken(request.headers.authorization);
    if (!token) return sendError(response, "UNAUTHORIZED", "Authentication is required", 401);
    const verified = verifyAccessToken(token);
    if (!verified) return sendError(response, "UNAUTHORIZED", "Authentication is required", 401);
    const result = await this.authService.me(verified.userId);
    if (result.error) {
      return sendError(response, result.error.code, result.error.message, result.status);
    }
    return sendSuccess(response, result.data);
  };

  verifyEmail = async (request: Request, response: Response) => {
    const payload = verifyEmailSchema.parse(request.body);
    const result = await this.authService.verifyEmail(payload.token);
    if (result.error) {
      return sendError(response, result.error.code, result.error.message, result.status);
    }
    return sendSuccess(response, result.data);
  };

  resendVerification = async (request: Request, response: Response) => {
    const payload = forgotPasswordSchema.parse(request.body);
    const result = await this.authService.resendVerification(payload.email);
    return sendSuccess(response, result.data);
  };

  forgotPassword = async (request: Request, response: Response) => {
    const payload = forgotPasswordSchema.parse(request.body);
    const result = await this.authService.forgotPassword(payload.email);
    return sendSuccess(response, result.data);
  };

  resetPassword = async (request: Request, response: Response) => {
    const payload = resetPasswordSchema.parse(request.body);
    const result = await this.authService.resetPassword(payload.token, payload.password);
    if (result.error) {
      return sendError(response, result.error.code, result.error.message, result.status);
    }
    return sendSuccess(response, result.data);
  };

  acceptInvitation = async (request: Request, response: Response) => {
    const payload = inviteAcceptSchema.parse(request.body);
    const result = await this.authService.acceptInvitation(payload.token, payload.name, payload.password);
    if (result.error) {
      return sendError(response, result.error.code, result.error.message, result.status);
    }
    return sendSuccess(response, result.data);
  };
}
