import { randomUUID } from "node:crypto";
import { prisma } from "../../data/prisma.js";

type ScoringCondition = {
  field: string;
  operator: string;
  value: unknown;
};

function evaluateScoringCondition(lead: {
  score: number;
  lifecycleStage: string;
  status: string;
  source: string;
  tagsJson: string;
  email: string;
  company: string;
  createdAt: Date;
}, condition: ScoringCondition): boolean {
  const { field, operator, value } = condition;
  let fieldValue: unknown;

  switch (field) {
    case "score": fieldValue = lead.score; break;
    case "lifecycleStage": fieldValue = lead.lifecycleStage; break;
    case "status": fieldValue = lead.status; break;
    case "source": fieldValue = lead.source; break;
    case "email": fieldValue = lead.email; break;
    case "company": fieldValue = lead.company; break;
    case "tags": fieldValue = JSON.parse(lead.tagsJson) as string[]; break;
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
      if (Array.isArray(fieldValue)) return !fieldValue.includes(value as string);
      return typeof fieldValue === "string" && !fieldValue.toLowerCase().includes(String(value).toLowerCase());
    case "in": return Array.isArray(value) && value.includes(fieldValue as string);
    case "not_in": return Array.isArray(value) && !value.includes(fieldValue as string);
    default: return false;
  }
}

export async function recalculateLeadScore(leadId: string): Promise<{ score: number; delta: number }> {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error("Lead not found");

  const rules = await prisma.scoringRule.findMany({
    where: { workspaceId: lead.workspaceId, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  let totalDelta = 0;
  const appliedRules: Array<{ ruleId: string; delta: number; reason: string }> = [];

  for (const rule of rules) {
    const condition = JSON.parse(rule.conditionJson) as ScoringCondition;
    const matches = evaluateScoringCondition(lead as any, condition);

    if (matches) {
      const delta = rule.type === "positive" ? rule.points : -rule.points;
      totalDelta += delta;
      appliedRules.push({ ruleId: rule.id, delta, reason: rule.name });
    }
  }

  const scoreBefore = lead.score;
  const scoreAfter = Math.max(0, Math.min(100, scoreBefore + totalDelta));

  if (scoreAfter !== scoreBefore) {
    await prisma.lead.update({
      where: { id: leadId },
      data: { score: scoreAfter, scoreUpdatedAt: new Date() },
    });

    // Log individual rule contributions
    for (const r of appliedRules) {
      await prisma.scoreHistory.create({
        data: {
          id: `sh_${randomUUID().slice(0, 8)}`,
          leadId,
          ruleId: r.ruleId,
          scoreBefore,
          scoreAfter,
          delta: r.delta,
          reason: r.reason,
        },
      });
    }

    // If no individual rules, log overall change
    if (appliedRules.length === 0 && totalDelta !== 0) {
      await prisma.scoreHistory.create({
        data: {
          id: `sh_${randomUUID().slice(0, 8)}`,
          leadId,
          scoreBefore,
          scoreAfter,
          delta: totalDelta,
          reason: "Automatic recalculation",
        },
      });
    }
  }

  return { score: scoreAfter, delta: totalDelta };
}

export async function recalculateWorkspaceScores(workspaceId: string): Promise<{ updated: number; total: number }> {
  const leads = await prisma.lead.findMany({ where: { workspaceId }, select: { id: true } });
  let updated = 0;

  for (const lead of leads) {
    const { delta } = await recalculateLeadScore(lead.id);
    if (delta !== 0) updated++;
  }

  return { updated, total: leads.length };
}

export async function applyScoreDelta(leadId: string, delta: number, reason: string, ruleId?: string): Promise<{ score: number }> {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error("Lead not found");

  const scoreBefore = lead.score;
  const scoreAfter = Math.max(0, Math.min(100, scoreBefore + delta));

  await prisma.lead.update({ where: { id: leadId }, data: { score: scoreAfter, scoreUpdatedAt: new Date() } });
  await prisma.scoreHistory.create({
    data: {
      id: `sh_${randomUUID().slice(0, 8)}`,
      leadId,
      ruleId: ruleId ?? null,
      scoreBefore,
      scoreAfter,
      delta,
      reason,
    },
  });

  return { score: scoreAfter };
}

export function generateAiScoringHints(): Array<{
  name: string;
  description: string;
  type: "positive" | "negative";
  condition: ScoringCondition;
  points: number;
}> {
  return [
    {
      name: "High engagement score",
      description: "Reward leads with existing high scores",
      type: "positive",
      condition: { field: "score", operator: "gte", value: 70 },
      points: 10,
    },
    {
      name: "Enterprise company",
      description: "Add points for enterprise-tier companies",
      type: "positive",
      condition: { field: "lifecycleStage", operator: "eq", value: "sql" },
      points: 25,
    },
    {
      name: "Stale lead",
      description: "Penalize leads inactive for 90+ days",
      type: "negative",
      condition: { field: "daysSinceCreated", operator: "gte", value: 90 },
      points: 15,
    },
    {
      name: "Website visitor",
      description: "Reward leads from organic web",
      type: "positive",
      condition: { field: "source", operator: "eq", value: "website" },
      points: 5,
    },
    {
      name: "Customer lifecycle",
      description: "Extra points for existing customers",
      type: "positive",
      condition: { field: "lifecycleStage", operator: "eq", value: "customer" },
      points: 30,
    },
  ];
}
