import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { getConfig } from "../config/env.js";
export function hashString(value) {
    return createHash("sha256").update(value).digest("hex");
}
export async function hashPassword(password) {
    return bcrypt.hash(password, 10);
}
export async function verifyPassword(password, passwordHash) {
    if (!passwordHash.startsWith("$2"))
        return false;
    return bcrypt.compare(password, passwordHash);
}
export function generateId(prefix) {
    return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
}
export function normalizeEmail(value) {
    return value.trim().toLowerCase();
}
export function slugify(value) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48);
}
export function createTokenValue(prefix) {
    return `${prefix}_${randomUUID().replace(/-/g, "")}`;
}
export function hashToken(token) {
    return hashString(token);
}
export function createAccessToken(userId, sessionId) {
    const tokenId = randomUUID();
    const signature = createHmac("sha256", getConfig().authTokenSecret).update(`${userId}.${sessionId}.${tokenId}`).digest("hex");
    return `${userId}.${sessionId}.${tokenId}.${signature}`;
}
export function createKeyMaterial(type) {
    const plaintextKey = `${type === "secret" ? "gc_live" : "gc_pub"}_${randomUUID().replace(/-/g, "")}`;
    const prefix = plaintextKey.slice(0, 16);
    return { plaintextKey, prefix, keyHash: hashString(plaintextKey) };
}
export function createVerificationTokenMaterial(type) {
    const prefix = type === "refresh_session" ? "refresh" : type === "email_verification" ? "verify" : "reset";
    const plaintextToken = `${prefix}_${randomUUID().replace(/-/g, "")}`;
    return { plaintextToken, tokenHash: hashString(plaintextToken) };
}
export function createSessionTokens(userId) {
    const sessionId = `sess_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
    const refreshToken = createVerificationTokenMaterial("refresh_session").plaintextToken;
    const accessToken = createAccessToken(userId, sessionId);
    return { sessionId, accessToken, refreshToken };
}
export function verifyAccessTokenSignature(token) {
    const parts = token.split(".");
    if (parts.length !== 4)
        return null;
    const [userId, sessionId, tokenId, providedSignature] = parts;
    const expectedSignature = createHmac("sha256", getConfig().authTokenSecret).update(`${userId}.${sessionId}.${tokenId}`).digest("hex");
    const providedBuffer = Buffer.from(providedSignature, "utf8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    if (providedBuffer.length !== expectedBuffer.length)
        return null;
    if (!timingSafeEqual(providedBuffer, expectedBuffer))
        return null;
    return { userId, sessionId, tokenId };
}
export function verifyAccessToken(token) {
    return verifyAccessTokenSignature(token);
}
export function extractBearerToken(header) {
    if (!header)
        return null;
    const [scheme, value] = header.split(" ");
    if (scheme !== "Bearer" || !value)
        return null;
    return value;
}
export function hashValue(value) {
    return hashString(value);
}
