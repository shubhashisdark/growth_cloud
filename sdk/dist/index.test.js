import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { GrowthCloud, init } from "./index.js";
describe("GrowthCloud SDK Initialisation", () => {
    it("initialises instance with required publicKey", () => {
        const client = new GrowthCloud({ publicKey: "pk_live_test123" });
        assert.ok(client instanceof GrowthCloud);
    });
    it("throws error if publicKey is missing", () => {
        assert.throws(() => {
            new GrowthCloud({ publicKey: "" });
        }, /publicKey is required/);
    });
    it("convenience init helper creates global client instance", () => {
        const instance = init({ publicKey: "pk_live_global_key" });
        assert.ok(instance instanceof GrowthCloud);
    });
});
describe("GrowthCloud SDK Input Validations", () => {
    const client = new GrowthCloud({ publicKey: "pk_live_test_key" });
    it("identify requires email", async () => {
        await assert.rejects(async () => {
            await client.identify("");
        }, /email is required/);
    });
    it("track requires eventName", async () => {
        await assert.rejects(async () => {
            await client.track("");
        }, /eventName is required/);
    });
    it("leadSync requires email", async () => {
        await assert.rejects(async () => {
            await client.leadSync({ email: "", firstName: "John" });
        }, /email is required/);
    });
    it("submitForm requires formId", async () => {
        await assert.rejects(async () => {
            await client.submitForm("", { email: "test@domain.com" });
        }, /formId is required/);
    });
});
