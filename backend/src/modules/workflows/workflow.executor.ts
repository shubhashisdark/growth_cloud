import { prisma } from "../../data/prisma.js";

export type RuleCondition = {
  field: string;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains" | "not_contains" | "in" | "not_in";
  value: string | number | string[];
};

export type WorkflowStep = {
  index: number;
  type: "trigger" | "condition" | "action" | "delay";
  actionType?: string;
  conditionField?: string;
  conditionOperator?: string;
  conditionValue?: unknown;
  delayMinutes?: number;
  config?: Record<string, unknown>;
};

export type WorkflowDefinition = {
  trigger: { type: string; config?: Record<string, unknown> };
  steps: WorkflowStep[];
};

type LeadRecord = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  score: number;
  lifecycleStage: string;
  status: string;
  tagsJson: string;
};

export function evaluateCondition(lead: LeadRecord, step: WorkflowStep): boolean {
  const { conditionField, conditionOperator, conditionValue } = step;
  if (!conditionField || !conditionOperator) return true;

  let fieldValue: unknown;
  switch (conditionField) {
    case "score":
      fieldValue = lead.score;
      break;
    case "lifecycleStage":
      fieldValue = lead.lifecycleStage;
      break;
    case "status":
      fieldValue = lead.status;
      break;
    case "email":
      fieldValue = lead.email;
      break;
    case "company":
      fieldValue = lead.company;
      break;
    case "tags": {
      const tags = JSON.parse(lead.tagsJson) as string[];
      fieldValue = tags;
      break;
    }
    default:
      fieldValue = undefined;
  }

  switch (conditionOperator) {
    case "eq":
      return fieldValue === conditionValue;
    case "neq":
      return fieldValue !== conditionValue;
    case "gt":
      return typeof fieldValue === "number" && typeof conditionValue === "number" && fieldValue > conditionValue;
    case "gte":
      return typeof fieldValue === "number" && typeof conditionValue === "number" && fieldValue >= conditionValue;
    case "lt":
      return typeof fieldValue === "number" && typeof conditionValue === "number" && fieldValue < conditionValue;
    case "lte":
      return typeof fieldValue === "number" && typeof conditionValue === "number" && fieldValue <= conditionValue;
    case "contains":
      if (Array.isArray(fieldValue)) return fieldValue.includes(conditionValue as string);
      return typeof fieldValue === "string" && fieldValue.toLowerCase().includes(String(conditionValue).toLowerCase());
    case "not_contains":
      if (Array.isArray(fieldValue)) return !fieldValue.includes(conditionValue as string);
      return typeof fieldValue === "string" && !fieldValue.toLowerCase().includes(String(conditionValue).toLowerCase());
    case "in":
      return Array.isArray(conditionValue) && conditionValue.includes(fieldValue as string);
    case "not_in":
      return Array.isArray(conditionValue) && !conditionValue.includes(fieldValue as string);
    default:
      return true;
  }
}

export async function matchesSegmentRules(
  lead: LeadRecord,
  rules: Record<string, unknown>
): Promise<boolean> {
  const { conditions = [], logic = "AND" } = rules as {
    conditions?: Array<{ field: string; operator: string; value: unknown }>;
    logic?: "AND" | "OR";
  };

  if (conditions.length === 0) return true;

  const results = conditions.map((cond) => {
    const step: WorkflowStep = {
      index: 0,
      type: "condition",
      conditionField: cond.field,
      conditionOperator: cond.operator,
      conditionValue: cond.value,
    };
    return evaluateCondition(lead, step);
  });

  return logic === "OR" ? results.some(Boolean) : results.every(Boolean);
}

export async function computeSegmentMembers(
  segmentId: string,
  workspaceId: string,
  rules: Record<string, unknown>
) {
  const leads = await prisma.lead.findMany({ where: { workspaceId } });

  const matched: string[] = [];
  for (const lead of leads) {
    const ok = await matchesSegmentRules(lead as unknown as LeadRecord, rules);
    if (ok) matched.push(lead.id);
  }
  return matched;
}
