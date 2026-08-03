import { Router } from "express";

import { AuthController } from "./controllers/auth.controller.js";

const authController = new AuthController();

export const authRouter = Router();

authRouter.post("/signup", authController.signup);
authRouter.post("/login", authController.login);
authRouter.post("/refresh", authController.refresh);
authRouter.post("/logout", authController.logout);
authRouter.get("/me", authController.me);
authRouter.post("/verify-email", authController.verifyEmail);
authRouter.post("/resend-verification", authController.resendVerification);
authRouter.post("/forgot-password", authController.forgotPassword);
authRouter.post("/reset-password", authController.resetPassword);
authRouter.post("/invites/accept", authController.acceptInvitation);
