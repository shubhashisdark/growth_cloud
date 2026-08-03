import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../../app.js";

describe("ai module integration", () => {
  it("responds to ai run requests", async () => {
    const app: any = createApp();
    const response = await app.fetch(new Request("http://localhost/api/v1/ai/run", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer test-token"
      },
      body: JSON.stringify({ type: "email-generator", input: { subject: "Launch" } })
    }));

    assert.equal(response.status, 401);
    const json = await response.json();
    assert.equal(json.error.code, "UNAUTHORIZED");
  });
});
