import { prisma } from "../../data/prisma.js";
export function evaluateCondition(lead, step) {
    const { conditionField, conditionOperator, conditionValue } = step;
    if (!conditionField || !conditionOperator)
        return true;
    let fieldValue;
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
            const tags = JSON.parse(lead.tagsJson);
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
            if (Array.isArray(fieldValue))
                return fieldValue.includes(conditionValue);
            return typeof fieldValue === "string" && fieldValue.toLowerCase().includes(String(conditionValue).toLowerCase());
        case "not_contains":
            if (Array.isArray(fieldValue))
                return !fieldValue.includes(conditionValue);
            return typeof fieldValue === "string" && !fieldValue.toLowerCase().includes(String(conditionValue).toLowerCase());
        case "in":
            return Array.isArray(conditionValue) && conditionValue.includes(fieldValue);
        case "not_in":
            return Array.isArray(conditionValue) && !conditionValue.includes(fieldValue);
        default:
            return true;
    }
}
export async function matchesSegmentRules(lead, rules) {
    const { conditions = [], logic = "AND" } = rules;
    if (conditions.length === 0)
        return true;
    const results = conditions.map((cond) => {
        const step = {
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
export async function computeSegmentMembers(segmentId, workspaceId, rules) {
    const leads = await prisma.lead.findMany({ where: { workspaceId } });
    const matched = [];
    for (const lead of leads) {
        const ok = await matchesSegmentRules(lead, rules);
        if (ok)
            matched.push(lead.id);
    }
    return matched;
}
