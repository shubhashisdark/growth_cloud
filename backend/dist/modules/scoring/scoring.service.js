import { randomUUID } from "node:crypto";
import { prisma } from "../../data/prisma.js";
function evaluateScoringCondition(lead, condition) {
    const { field, operator, value } = condition;
    let fieldValue;
    switch (field) {
        case "score":
            fieldValue = lead.score;
            break;
        case "lifecycleStage":
            fieldValue = lead.lifecycleStage;
            break;
        case "status":
            fieldValue = lead.status;
            break;
        case "source":
            fieldValue = lead.source;
            break;
        case "email":
            fieldValue = lead.email;
            break;
        case "company":
            fieldValue = lead.company;
            break;
        case "tags":
            fieldValue = JSON.parse(lead.tagsJson);
            break;
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
            if (Array.isArray(fieldValue))
                return fieldValue.includes(value);
            return typeof fieldValue === "string" && fieldValue.toLowerCase().includes(String(value).toLowerCase());
        case "not_contains":
            if (Array.isArray(fieldValue))
                return !fieldValue.includes(value);
            return typeof fieldValue === "string" && !fieldValue.toLowerCase().includes(String(value).toLowerCase());
        case "in": return Array.isArray(value) && value.includes(fieldValue);
        case "not_in": return Array.isArray(value) && !value.includes(fieldValue);
        default: return false;
    }
}
export async function recalculateLeadScore(leadId) {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead)
        throw new Error("Lead not found");
    const rules = await prisma.scoringRule.findMany({
        where: { workspaceId: lead.workspaceId, isActive: true },
        orderBy: { createdAt: "asc" },
    });
    let totalDelta = 0;
    const appliedRules = [];
    for (const rule of rules) {
        const condition = JSON.parse(rule.conditionJson);
        const matches = evaluateScoringCondition(lead, condition);
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
export async function recalculateWorkspaceScores(workspaceId) {
    const leads = await prisma.lead.findMany({ where: { workspaceId }, select: { id: true } });
    let updated = 0;
    for (const lead of leads) {
        const { delta } = await recalculateLeadScore(lead.id);
        if (delta !== 0)
            updated++;
    }
    return { updated, total: leads.length };
}
export async function applyScoreDelta(leadId, delta, reason, ruleId) {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead)
        throw new Error("Lead not found");
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
export function generateAiScoringHints() {
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
