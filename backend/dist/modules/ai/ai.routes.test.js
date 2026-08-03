import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../../app.js";
describe("ai routes", () => {
    it("exposes ai module in api index", async () => {
        const app = createApp();
        const response = await app.fetch(new Request("http://localhost/api/v1"));
        const json = await response.json();
        assert.equal(response.status, 200);
        assert.ok(json.data.modules.includes("ai"));
    });
});
