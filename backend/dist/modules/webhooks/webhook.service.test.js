import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateWebhookSecret, signWebhookPayload, verifyWebhookSignature } from "./webhook.crypto.js";
describe("Webhook Cryptography & HMAC Signatures", () => {
    it("generates a secret starting with whsec_", () => {
        const secret = generateWebhookSecret();
        assert.ok(secret.startsWith("whsec_"));
        assert.ok(secret.length > 20);
    });
    it("signs payload and produces valid header signature", () => {
        const secret = generateWebhookSecret();
        const payload = JSON.stringify({ event: "lead.created", id: "lead_123" });
        const timestamp = 1700000000;
        const signatureHeader = signWebhookPayload(payload, secret, timestamp);
        assert.ok(signatureHeader.includes(`t=${timestamp}`));
        assert.ok(signatureHeader.includes("v1="));
    });
    it("verifies matching signature successfully within timestamp tolerance", () => {
        const secret = generateWebhookSecret();
        const payload = JSON.stringify({ event: "lead.created", email: "test@company.com" });
        const timestamp = Math.floor(Date.now() / 1000);
        const signatureHeader = signWebhookPayload(payload, secret, timestamp);
        const isValid = verifyWebhookSignature(payload, signatureHeader, secret);
        assert.equal(isValid, true);
    });
    it("rejects tampered payload signature", () => {
        const secret = generateWebhookSecret();
        const payload = JSON.stringify({ event: "lead.created", email: "legit@company.com" });
        const timestamp = Math.floor(Date.now() / 1000);
        const signatureHeader = signWebhookPayload(payload, secret, timestamp);
        const tamperedPayload = JSON.stringify({ event: "lead.created", email: "hacked@company.com" });
        const isValid = verifyWebhookSignature(tamperedPayload, signatureHeader, secret);
        assert.equal(isValid, false);
    });
    it("rejects expired timestamp signatures outside tolerance", () => {
        const secret = generateWebhookSecret();
        const payload = JSON.stringify({ event: "lead.created" });
        const expiredTimestamp = Math.floor(Date.now() / 1000) - 600; // 10 minutes ago
        const signatureHeader = signWebhookPayload(payload, secret, expiredTimestamp);
        const isValid = verifyWebhookSignature(payload, signatureHeader, secret, 300); // 5-minute tolerance
        assert.equal(isValid, false);
    });
});
