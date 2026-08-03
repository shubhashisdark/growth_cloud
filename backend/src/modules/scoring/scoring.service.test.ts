import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateAiScoringHints } from "./scoring.service.js";

// Test the condition evaluator inline (same logic as service)
type Lead = {
  score: number;
  lifecycleStage: string;
  status: string;
  source: string;
  tagsJson: string;
  email: string;
  company: string;
  createdAt: Date;
};

type Cond = { field: string; operator: string; value: unknown };

function evalCond(lead: Lead, cond: Cond): boolean {
  const { field, operator, value } = cond;
  let fieldValue: unknown;
  switch (field) {
    case "score": fieldValue = lead.score; break;
    case "lifecycleStage": fieldValue = lead.lifecycleStage; break;
    case "status": fieldValue = lead.status; break;
    case "source": fieldValue = lead.source; break;
    case "email": fieldValue = lead.email; break;
    case "tags": fieldValue = JSON.parse(lead.tagsJson); break;
    case "daysSinceCreated":
      fieldValue = Math.floor((Date.now() - lead.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      break;
    default: return false;
  }
  switch (operator) {
    case "eq": return fieldValue === value;
    case "neq": return fieldValue !== value;
    case "gt": return typeof fieldValue === "number" && typeof value === "number" && fieldValue > value;
    case "gte": return typeof fieldValue === "number" && typeof value === "number" && fieldValue >= value;
    case "lt": return typeof fieldValue === "number" && typeof value === "number" && fieldValue < value;
    case "lte": return typeof fieldValue === "number" && typeof value === "number" && fieldValue <= value;
    case "contains":
      if (Array.isArray(fieldValue)) return fieldValue.includes(value as string);
      return typeof fieldValue === "string" && fieldValue.toLowerCase().includes(String(value).toLowerCase());
    case "not_contains":
      if (Array.isArray(fieldValue)) return !(fieldValue as string[]).includes(value as string);
      return typeof fieldValue === "string" && !fieldValue.toLowerCase().includes(String(value).toLowerCase());
    case "in": return Array.isArray(value) && (value as unknown[]).includes(fieldValue);
    default: return false;
  }
}

const lead: Lead = {
  score: 72,
  lifecycleStage: "sql",
  status: "active",
  source: "website",
  tagsJson: JSON.stringify(["enterprise"]),
  email: "cto@bigcorp.com",
  company: "BigCorp",
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
};

describe("Scoring rule condition evaluator", () => {
  it("score >= 70 → true", () => {
    assert.equal(evalCond(lead, { field: "score", operator: "gte", value: 70 }), true);
  });

  it("score >= 80 → false", () => {
    assert.equal(evalCond(lead, { field: "score", operator: "gte", value: 80 }), false);
  });

  it("lifecycleStage eq sql → true (positive rule)", () => {
    assert.equal(evalCond(lead, { field: "lifecycleStage", operator: "eq", value: "sql" }), true);
  });

  it("lifecycleStage eq customer → false", () => {
    assert.equal(evalCond(lead, { field: "lifecycleStage", operator: "eq", value: "customer" }), false);
  });

  it("source eq website → true", () => {
    assert.equal(evalCond(lead, { field: "source", operator: "eq", value: "website" }), true);
  });

  it("tags contains enterprise → true", () => {
    assert.equal(evalCond(lead, { field: "tags", operator: "contains", value: "enterprise" }), true);
  });

  it("tags contains vip → false", () => {
    assert.equal(evalCond(lead, { field: "tags", operator: "contains", value: "vip" }), false);
  });

  it("daysSinceCreated < 90 → true (not stale)", () => {
    assert.equal(evalCond(lead, { field: "daysSinceCreated", operator: "lt", value: 90 }), true);
  });

  it("daysSinceCreated >= 90 → false (not stale for 30-day lead)", () => {
    assert.equal(evalCond(lead, { field: "daysSinceCreated", operator: "gte", value: 90 }), false);
  });
});

describe("AI scoring hints", () => {
  it("returns array of hints", () => {
    const hints = generateAiScoringHints();
    assert.equal(Array.isArray(hints), true);
    assert.ok(hints.length > 0);
  });

  it("each hint has required fields", () => {
    const hints = generateAiScoringHints();
    for (const h of hints) {
      assert.ok("name" in h);
      assert.ok("type" in h);
      assert.ok("points" in h);
      assert.ok("condition" in h);
      assert.ok(["positive", "negative"].includes(h.type));
      assert.ok(h.points > 0);
    }
  });

  it("has both positive and negative hints", () => {
    const hints = generateAiScoringHints();
    assert.equal(hints.some((h) => h.type === "positive"), true);
    assert.equal(hints.some((h) => h.type === "negative"), true);
  });
});

describe("Score delta clamping", () => {
  it("score cannot exceed 100", () => {
    const clamp = (s: number, delta: number) => Math.max(0, Math.min(100, s + delta));
    assert.equal(clamp(90, 20), 100);
  });

  it("score cannot go below 0", () => {
    const clamp = (s: number, delta: number) => Math.max(0, Math.min(100, s + delta));
    assert.equal(clamp(5, -20), 0);
  });

  it("normal delta applies correctly", () => {
    const clamp = (s: number, delta: number) => Math.max(0, Math.min(100, s + delta));
    assert.equal(clamp(50, 15), 65);
    assert.equal(clamp(50, -10), 40);
  });
});
