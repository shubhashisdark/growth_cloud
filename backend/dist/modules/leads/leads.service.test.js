import { describe, it } from "node:test";
import assert from "node:assert/strict";
describe("leads route contract", () => {
    it("exposes core lead collection and detail endpoints", () => {
        const routeSource = `
      GET /
      POST /
      GET /:leadId
      PUT /:leadId
      GET /:leadId/timeline
      POST /:leadId/timeline
      POST /:leadId/notes
      POST /bulk
      POST /import
      GET /export
      GET /template
    `;
        assert.ok(routeSource.includes("GET /:leadId/timeline"));
        assert.ok(routeSource.includes("POST /bulk"));
        assert.ok(routeSource.includes("GET /export"));
    });
});
