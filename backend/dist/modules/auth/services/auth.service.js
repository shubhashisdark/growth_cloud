import { randomUUID } from "node:crypto";
import { prisma } from "../../../data/prisma.js";
import { createKeyMaterial, createSessionTokens, createVerificationTokenMaterial, hashPassword, hashValue, slugify, verifyPassword } from "../../../lib/auth.js";
import { logAudit } from "../../../lib/audit.js";
import { getConfig } from "../../../config/env.js";
import { buildResetPasswordEmail, buildVerificationEmail, sendEmailWithFallback } from "../../email/email.service.js";
import { UserRepository } from "../repositories/user.repository.js";
export class AuthService {
    userRepository;
    constructor(userRepository = new UserRepository()) {
        this.userRepository = userRepository;
    }
    async signup(input) {
        const normalizedEmail = input.email.trim().toLowerCase();
        const baseSlug = slugify(input.workspaceName) || "workspace";
        const workspaceSlug = `${baseSlug}-${randomUUID().slice(0, 6)}`;
        const workspaceId = `ws_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
        const userId = `usr_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
        const keyMaterial = createKeyMaterial("secret");
        const existingUser = await this.userRepository.findByEmail(normalizedEmail);
        if (existingUser) {
            return { error: { code: "USER_ALREADY_EXISTS", message: "An account with this email already exists" }, status: 409 };
        }
        await prisma.user.create({
            data: {
                id: userId,
                name: input.name,
                email: normalizedEmail,
                passwordHash: await hashPassword(input.password),
                status: "active",
                // emailVerifiedAt is intentionally NOT set — user must verify via email link
            },
        });
        await prisma.workspace.create({
            data: {
                id: workspaceId,
                name: input.workspaceName,
                slug: workspaceSlug,
                plan: "trial",
                timezone: "UTC",
                status: "active",
                ownerId: userId,
            },
        });
        await prisma.workspaceMember.create({
            data: {
                id: `wm_${randomUUID().slice(0, 8)}`,
                workspaceId,
                userId,
                role: "super_admin",
            },
        });
        await prisma.apiKey.create({
            data: {
                id: `key_${randomUUID().slice(0, 8)}`,
                workspaceId,
                name: "Primary Secret Key",
                prefix: keyMaterial.prefix,
                keyHash: keyMaterial.keyHash,
                type: "secret",
                status: "active",
                scopesJson: JSON.stringify(["auth:read", "workspaces:read", "workspaces:write", "users:write"]),
            },
        });
        // Create email verification token and send verification link
        const verification = createVerificationTokenMaterial("email_verification");
        await prisma.verificationToken.create({
            data: {
                id: `vfy_${randomUUID().slice(0, 8)}`,
                userId,
                tokenHash: verification.tokenHash,
                type: "email_verification",
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
            },
        });
        await logAudit("auth.signup", "User", userId, workspaceId, userId, { email: normalizedEmail });
        const baseUrl = getConfig().appBaseUrl || "http://localhost:3000";
        const verifyUrl = `${baseUrl}/verify-email?token=${verification.plaintextToken}`;
        const verificationEmail = buildVerificationEmail(input.name, verifyUrl);
        await sendEmailWithFallback({ to: normalizedEmail, ...verificationEmail });
        return {
            status: 201,
            data: {
                user: { id: userId, name: input.name, email: normalizedEmail, role: "super_admin", status: "active" },
                workspace: { id: workspaceId, name: input.workspaceName, slug: workspaceSlug },
                membership: { workspaceId, userId, role: "super_admin" },
                apiKey: { prefix: keyMaterial.prefix, type: "secret", scopes: ["auth:read", "workspaces:read", "workspaces:write", "users:write"] },
            },
        };
    }
    async login(input) {
        const user = await prisma.user.findUnique({ where: { email: input.email }, include: { memberships: true } });
        if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
            return { error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" }, status: 401 };
        }
        const session = await this.issueSession(user.id);
        await logAudit("auth.login", "Session", session.accessToken.split(".")[1], user.memberships[0]?.workspaceId ?? null, user.id);
        return {
            status: 200,
            data: {
                accessToken: session.accessToken,
                refreshToken: session.refreshToken,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    status: user.status,
                    memberships: user.memberships.map((membership) => ({ workspaceId: membership.workspaceId, role: membership.role })),
                },
            },
        };
    }
    async refresh(refreshToken) {
        const refreshHash = hashValue(refreshToken);
        const session = await prisma.session.findFirst({ where: { refreshHash, revokedAt: null, expiresAt: { gt: new Date() } }, include: { user: { include: { memberships: true } } } });
        if (!session) {
            return { error: { code: "INVALID_REFRESH_TOKEN", message: "Refresh token is invalid or expired" }, status: 401 };
        }
        const tokens = await this.issueSession(session.userId);
        await prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
        await logAudit("auth.refresh", "Session", session.id, session.user.memberships[0]?.workspaceId ?? null, session.userId);
        return { status: 200, data: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken } };
    }
    async logout(userId, sessionId) {
        await prisma.session.update({ where: { id: sessionId }, data: { revokedAt: new Date() } });
        await logAudit("auth.logout", "Session", sessionId, null, userId);
        return { status: 200, data: { success: true } };
    }
    async me(userId) {
        const user = await prisma.user.findUnique({ where: { id: userId }, include: { memberships: { include: { workspace: true } } } });
        if (!user) {
            return { error: { code: "UNAUTHORIZED", message: "Authentication is required" }, status: 401 };
        }
        return {
            status: 200,
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    status: user.status,
                    emailVerifiedAt: user.emailVerifiedAt,
                    memberships: user.memberships.map((membership) => ({ workspaceId: membership.workspaceId, workspaceName: membership.workspace.name, role: membership.role })),
                },
            },
        };
    }
    async verifyEmail(token) {
        const tokenHash = hashValue(token);
        const verificationToken = await prisma.verificationToken.findUnique({ where: { tokenHash }, include: { user: true } });
        if (!verificationToken || verificationToken.type !== "email_verification" || verificationToken.usedAt || verificationToken.expiresAt.getTime() < Date.now()) {
            return { error: { code: "INVALID_TOKEN", message: "Verification token is invalid or expired" }, status: 400 };
        }
        await prisma.user.update({ where: { id: verificationToken.userId }, data: { status: "active", emailVerifiedAt: new Date() } });
        await prisma.verificationToken.update({ where: { tokenHash }, data: { usedAt: new Date() } });
        await logAudit("auth.verify_email", "User", verificationToken.userId, null, verificationToken.userId);
        return { status: 200, data: { verified: true } };
    }
    async resendVerification(email) {
        const normalizedEmail = email.trim().toLowerCase();
        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user || user.emailVerifiedAt) {
            return { status: 200, data: { email: normalizedEmail, delivered: false, message: "If an unverified account exists, a verification link has been sent" } };
        }
        const verification = createVerificationTokenMaterial("email_verification");
        await prisma.verificationToken.create({
            data: {
                id: `vfy_${randomUUID().slice(0, 8)}`,
                userId: user.id,
                tokenHash: verification.tokenHash,
                type: "email_verification",
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
            },
        });
        const baseUrl = getConfig().appBaseUrl || "http://localhost:3000";
        const verifyUrl = `${baseUrl}/verify-email?token=${verification.plaintextToken}`;
        const verificationEmail = buildVerificationEmail(user.name, verifyUrl);
        await sendEmailWithFallback({ to: user.email, ...verificationEmail });
        return { status: 200, data: { email: user.email, delivered: true, verificationToken: getConfig().exposeResetTokenInResponse ? verification.plaintextToken : null, message: "Verification email sent" } };
    }
    async forgotPassword(email) {
        const normalizedEmail = email.trim().toLowerCase();
        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (!user) {
            return { status: 200, data: { email: normalizedEmail, delivered: false, resetToken: null, message: "If an account exists, a reset link has been sent" } };
        }
        try {
            const token = createVerificationTokenMaterial("password_reset");
            await prisma.passwordResetToken.create({
                data: {
                    id: `prt_${randomUUID().slice(0, 8)}`,
                    userId: user.id,
                    tokenHash: token.tokenHash,
                    expiresAt: new Date(Date.now() + 1000 * 60 * 60),
                },
            });
            await logAudit("auth.password_reset_requested", "PasswordResetToken", token.tokenHash, null, user.id);
            const baseUrl = getConfig().appBaseUrl || "http://localhost:3000";
            const resetUrl = `${baseUrl}/reset-password?token=${token.plaintextToken}`;
            const emailPayload = buildResetPasswordEmail(user.name, resetUrl);
            await sendEmailWithFallback({ to: user.email, ...emailPayload });
            return { status: 200, data: { email: user.email, delivered: true, resetToken: getConfig().exposeResetTokenInResponse ? token.plaintextToken : null, message: "If an account exists, a reset link has been sent" } };
        }
        catch {
            return { status: 200, data: { email: user.email, delivered: false, resetToken: null, message: "If an account exists, a reset link has been sent" } };
        }
    }
    async resetPassword(token, password) {
        const tokenHash = hashValue(token);
        const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash }, include: { user: true } });
        if (!resetToken || resetToken.usedAt || resetToken.expiresAt.getTime() < Date.now()) {
            return { error: { code: "INVALID_RESET_TOKEN", message: "Reset token is invalid or expired" }, status: 400 };
        }
        const user = await prisma.user.update({
            where: { id: resetToken.userId },
            data: { passwordHash: await hashPassword(password), status: "active" },
            select: { id: true, name: true, email: true },
        });
        await prisma.passwordResetToken.update({ where: { tokenHash }, data: { usedAt: new Date() } });
        await logAudit("auth.password_reset", "User", resetToken.userId, null, resetToken.userId);
        return { status: 200, data: { reset: true, user } };
    }
    async acceptInvitation(token, name, password) {
        const tokenHash = hashValue(token);
        const invitation = await prisma.workspaceInvitation.findUnique({ where: { tokenHash }, include: { workspace: true } });
        if (!invitation || invitation.status !== "pending" || invitation.expiresAt.getTime() < Date.now()) {
            return { error: { code: "INVALID_TOKEN", message: "Invitation is invalid or expired" }, status: 400 };
        }
        const user = await prisma.user.upsert({
            where: { email: invitation.email },
            update: { name, passwordHash: await hashPassword(password), status: "active", emailVerifiedAt: new Date() },
            create: { id: `usr_${slugify(invitation.email.split("@")[0]) || randomUUID().slice(0, 8)}`, name, email: invitation.email, passwordHash: await hashPassword(password), status: "active", emailVerifiedAt: new Date() },
        });
        await prisma.workspaceMember.upsert({
            where: { workspaceId_userId: { workspaceId: invitation.workspaceId, userId: user.id } },
            update: { role: invitation.role },
            create: { id: `wm_${randomUUID().slice(0, 8)}`, workspaceId: invitation.workspaceId, userId: user.id, role: invitation.role },
        });
        await prisma.workspaceInvitation.update({ where: { tokenHash }, data: { status: "accepted", acceptedAt: new Date(), acceptedById: user.id } });
        await logAudit("workspace.invite_accepted", "WorkspaceInvitation", invitation.id, invitation.workspaceId, user.id, { email: user.email });
        return { status: 200, data: { accepted: true, user } };
    }
    async issueSession(userId) {
        const { accessToken, refreshToken } = createSessionTokens(userId);
        const accessHash = hashValue(accessToken);
        const refreshHash = hashValue(refreshToken);
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
        await prisma.session.create({
            data: {
                id: accessToken.split(".")[1],
                userId,
                tokenHash: accessHash,
                refreshHash,
                expiresAt,
            },
        });
        return { accessToken, refreshToken };
    }
}
