import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "./app.js";
test("GET /health returns ok status", async () => {
    const app = createApp();
    const response = await app.fetch(new Request("http://127.0.0.1/health"));
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.data.status, "ok");
    assert.equal(body.data.service, "growth-cloud-backend");
    assert.equal(body.error, null);
});
test("GET /api/v1 returns module catalog", async () => {
    const app = createApp();
    const response = await app.fetch(new Request("http://127.0.0.1/api/v1"));
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.data.name, "Growth Cloud Backend API");
    assert.ok(Array.isArray(body.data.modules));
    assert.ok(body.data.modules.includes("auth"));
    assert.ok(body.data.modules.includes("workspaces"));
    assert.equal(body.error, null);
});
