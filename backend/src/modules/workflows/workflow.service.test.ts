import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { evaluateCondition } from "./workflow.executor.js";
import type { WorkflowStep } from "./workflow.executor.js";

const mockLead = {
  id: "lead_1",
  email: "john@acme.com",
  firstName: "John",
  lastName: "Doe",
  company: "Acme Corp",
  score: 65,
  lifecycleStage: "mql",
  status: "active",
  tagsJson: JSON.stringify(["enterprise", "demo-booked"]),
};

function makeStep(field: string, operator: string, value: unknown): WorkflowStep {
  return {
    index: 0,
    type: "condition",
    conditionField: field,
    conditionOperator: operator,
    conditionValue: value,
  };
}

describe("evaluateCondition", () => {
  it("score > 50 → true", () => {
    assert.equal(evaluateCondition(mockLead, makeStep("score", "gt", 50)), true);
  });

  it("score > 80 → false", () => {
    assert.equal(evaluateCondition(mockLead, makeStep("score", "gt", 80)), false);
  });

  it("score >= 65 → true", () => {
    assert.equal(evaluateCondition(mockLead, makeStep("score", "gte", 65)), true);
  });

  it("score <= 60 → false", () => {
    assert.equal(evaluateCondition(mockLead, makeStep("score", "lte", 60)), false);
  });

  it("lifecycleStage eq mql → true", () => {
    assert.equal(evaluateCondition(mockLead, makeStep("lifecycleStage", "eq", "mql")), true);
  });

  it("lifecycleStage eq sql → false", () => {
    assert.equal(evaluateCondition(mockLead, makeStep("lifecycleStage", "eq", "sql")), false);
  });

  it("email contains acme → true", () => {
    assert.equal(evaluateCondition(mockLead, makeStep("email", "contains", "acme")), true);
  });

  it("email not_contains gmail → true", () => {
    assert.equal(evaluateCondition(mockLead, makeStep("email", "not_contains", "gmail")), true);
  });

  it("tags contains enterprise → true", () => {
    assert.equal(evaluateCondition(mockLead, makeStep("tags", "contains", "enterprise")), true);
  });

  it("tags contains vip → false", () => {
    assert.equal(evaluateCondition(mockLead, makeStep("tags", "contains", "vip")), false);
  });

  it("lifecycleStage in [mql, sql] → true", () => {
    assert.equal(evaluateCondition(mockLead, makeStep("lifecycleStage", "in", ["mql", "sql"])), true);
  });

  it("lifecycleStage not_in [customer] → true", () => {
    assert.equal(evaluateCondition(mockLead, makeStep("lifecycleStage", "not_in", ["customer"])), true);
  });

  it("unknown field → false", () => {
    assert.equal(evaluateCondition(mockLead, makeStep("unknownField", "eq", "anything")), false);
  });

  it("no conditionField → true", () => {
    const step: WorkflowStep = { index: 0, type: "condition" };
    assert.equal(evaluateCondition(mockLead, step), true);
  });
});

describe("matchesSegmentRules", () => {
  it("AND logic: all conditions must match", async () => {
    const { matchesSegmentRules } = await import("./workflow.executor.js");
    const result = await matchesSegmentRules(mockLead, {
      logic: "AND",
      conditions: [
        { field: "score", operator: "gte", value: 50 },
        { field: "lifecycleStage", operator: "eq", value: "mql" },
      ],
    });
    assert.equal(result, true);
  });

  it("AND logic: one fails → false", async () => {
    const { matchesSegmentRules } = await import("./workflow.executor.js");
    const result = await matchesSegmentRules(mockLead, {
      logic: "AND",
      conditions: [
        { field: "score", operator: "gte", value: 50 },
        { field: "lifecycleStage", operator: "eq", value: "sql" }, // fails
      ],
    });
    assert.equal(result, false);
  });

  it("OR logic: one passes → true", async () => {
    const { matchesSegmentRules } = await import("./workflow.executor.js");
    const result = await matchesSegmentRules(mockLead, {
      logic: "OR",
      conditions: [
        { field: "lifecycleStage", operator: "eq", value: "sql" }, // fails
        { field: "score", operator: "gte", value: 50 }, // passes
      ],
    });
    assert.equal(result, true);
  });

  it("empty conditions → true (matches all)", async () => {
    const { matchesSegmentRules } = await import("./workflow.executor.js");
    const result = await matchesSegmentRules(mockLead, { logic: "AND", conditions: [] });
    assert.equal(result, true);
  });
});
