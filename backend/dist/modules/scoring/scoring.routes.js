import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../data/prisma.js";
import { requireAuth, requireWorkspaceMember } from "../../middleware/auth.middleware.js";
import { recalculateLeadScore, recalculateWorkspaceScores, applyScoreDelta, generateAiScoringHints, } from "./scoring.service.js";
const conditionSchema = z.object({
    field: z.enum(["score", "lifecycleStage", "status", "source", "email", "company", "tags", "daysSinceCreated"]),
    operator: z.enum(["eq", "neq", "gt", "gte", "lt", "lte", "contains", "not_contains", "in", "not_in"]),
    value: z.union([z.string(), z.number(), z.array(z.string())]),
});
const ruleSchema = z.object({
    workspaceId: z.string().min(1),
    name: z.string().min(2),
    description: z.string().optional(),
    type: z.enum(["positive", "negative"]),
    condition: conditionSchema,
    points: z.number().int().min(1).max(100),
    isActive: z.boolean().default(true),
});
const ruleUpdateSchema = ruleSchema.partial().omit({ workspaceId: true });
export const scoringRouter = Router();
// GET /api/v1/scoring/rules?workspaceId=
scoringRouter.get("/rules", requireAuth, requireWorkspaceMember(), async (req, res) => {
    const workspaceId = req.workspace.workspaceId;
    const rules = await prisma.scoringRule.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "asc" },
    });
    // Score stats
    const leadStats = await prisma.lead.aggregate({
        where: { workspaceId },
        _avg: { score: true },
        _max: { score: true },
        _min: { score: true },
        _count: { id: true },
    });
    const highScoreCount = await prisma.lead.count({ where: { workspaceId, score: { gte: 80 } } });
    const lowScoreCount = await prisma.lead.count({ where: { workspaceId, score: { lte: 20 } } });
    res.json({
        data: {
            rules: rules.map((r) => ({
                id: r.id,
                workspaceId: r.workspaceId,
                name: r.name,
                description: r.description,
                type: r.type,
                condition: JSON.parse(r.conditionJson),
                points: r.points,
                isActive: r.isActive,
                createdAt: r.createdAt,
                updatedAt: r.updatedAt,
            })),
            stats: {
                totalLeads: leadStats._count.id,
                avgScore: Math.round(leadStats._avg.score ?? 0),
                maxScore: leadStats._max.score ?? 0,
                minScore: leadStats._min.score ?? 0,
                highScoreLeads: highScoreCount,
                lowScoreLeads: lowScoreCount,
            },
        },
        meta: { total: rules.length, timestamp: new Date().toISOString() },
        error: null,
    });
});
// POST /api/v1/scoring/rules
scoringRouter.post("/rules", requireAuth, requireWorkspaceMember(), async (req, res) => {
    const workspaceId = req.workspace.workspaceId;
    const payload = ruleSchema.parse(req.body);
    const rule = await prisma.scoringRule.create({
        data: {
            id: `sr_${randomUUID().slice(0, 10)}`,
            workspaceId,
            name: payload.name,
            description: payload.description,
            type: payload.type,
            conditionJson: JSON.stringify(payload.condition),
            points: payload.points,
            isActive: payload.isActive,
        },
    });
    res.status(201).json({
        data: { ...rule, condition: payload.condition, conditionJson: undefined },
        meta: { timestamp: new Date().toISOString() },
        error: null,
    });
});
// PATCH /api/v1/scoring/rules/:ruleId
scoringRouter.patch("/rules/:ruleId", requireAuth, requireWorkspaceMember(), async (req, res) => {
    const workspaceId = req.workspace.workspaceId;
    const ruleId = req.params.ruleId;
    const payload = ruleUpdateSchema.parse(req.body);
    const existing = await prisma.scoringRule.findFirst({ where: { id: ruleId, workspaceId } });
    if (!existing)
        return res.status(404).json({ data: null, error: { code: "NOT_FOUND", message: "Rule not found" }, meta: {} });
    const updated = await prisma.scoringRule.update({
        where: { id: ruleId },
        data: {
            name: payload.name ?? existing.name,
            description: payload.description ?? existing.description,
            type: payload.type ?? existing.type,
            conditionJson: payload.condition ? JSON.stringify(payload.condition) : existing.conditionJson,
            points: payload.points ?? existing.points,
            isActive: payload.isActive ?? existing.isActive,
        },
    });
    res.json({
        data: { ...updated, condition: JSON.parse(updated.conditionJson), conditionJson: undefined },
        meta: { timestamp: new Date().toISOString() },
        error: null,
    });
});
// DELETE /api/v1/scoring/rules/:ruleId
scoringRouter.delete("/rules/:ruleId", requireAuth, requireWorkspaceMember(), async (req, res) => {
    const workspaceId = req.workspace.workspaceId;
    const ruleId = req.params.ruleId;
    const existing = await prisma.scoringRule.findFirst({ where: { id: ruleId, workspaceId } });
    if (!existing)
        return res.status(404).json({ data: null, error: { code: "NOT_FOUND", message: "Rule not found" }, meta: {} });
    await prisma.scoringRule.delete({ where: { id: ruleId } });
    res.json({ data: { deleted: true }, meta: { timestamp: new Date().toISOString() }, error: null });
});
// POST /api/v1/scoring/recalculate — full workspace recalculation
scoringRouter.post("/recalculate", requireAuth, requireWorkspaceMember(), async (req, res) => {
    const workspaceId = req.workspace.workspaceId;
    const result = await recalculateWorkspaceScores(workspaceId);
    res.json({
        data: result,
        meta: { timestamp: new Date().toISOString() },
        error: null,
    });
});
// POST /api/v1/scoring/recalculate/:leadId — single lead
scoringRouter.post("/recalculate/:leadId", requireAuth, requireWorkspaceMember(), async (req, res) => {
    const result = await recalculateLeadScore(req.params.leadId);
    res.json({ data: result, meta: { timestamp: new Date().toISOString() }, error: null });
});
// POST /api/v1/scoring/adjust — manual delta
scoringRouter.post("/adjust", requireAuth, requireWorkspaceMember(), async (req, res) => {
    const { leadId, delta, reason } = z.object({
        leadId: z.string().min(1),
        delta: z.number().int(),
        reason: z.string().min(1),
    }).parse(req.body);
    const result = await applyScoreDelta(leadId, delta, reason);
    res.json({ data: result, meta: { timestamp: new Date().toISOString() }, error: null });
});
// GET /api/v1/scoring/history/:leadId
scoringRouter.get("/history/:leadId", requireAuth, requireWorkspaceMember(), async (req, res) => {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Number(req.query.limit ?? 50));
    const leadId = req.params.leadId;
    const [history, total] = await Promise.all([
        prisma.scoreHistory.findMany({
            where: { leadId },
            include: { rule: { select: { name: true, type: true } } },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.scoreHistory.count({ where: { leadId } }),
    ]);
    res.json({
        data: {
            items: history.map((h) => ({
                id: h.id,
                leadId: h.leadId,
                ruleId: h.ruleId,
                ruleName: h.rule?.name ?? null,
                ruleType: h.rule?.type ?? null,
                scoreBefore: h.scoreBefore,
                scoreAfter: h.scoreAfter,
                delta: h.delta,
                reason: h.reason,
                createdAt: h.createdAt,
            })),
        },
        meta: { total, page, limit, pages: Math.ceil(total / limit), timestamp: new Date().toISOString() },
        error: null,
    });
});
// GET /api/v1/scoring/ai-hints — AI-suggested rule templates
scoringRouter.get("/ai-hints", requireAuth, requireWorkspaceMember(), async (_req, res) => {
    const hints = generateAiScoringHints();
    res.json({ data: { hints }, meta: { timestamp: new Date().toISOString() }, error: null });
});
// GET /api/v1/scoring/leaderboard — top/bottom leads by score
scoringRouter.get("/leaderboard", requireAuth, requireWorkspaceMember(), async (req, res) => {
    const workspaceId = req.workspace.workspaceId;
    const [topLeads, bottomLeads] = await Promise.all([
        prisma.lead.findMany({
            where: { workspaceId },
            orderBy: { score: "desc" },
            take: 10,
            select: { id: true, firstName: true, lastName: true, email: true, score: true, lifecycleStage: true, scoreUpdatedAt: true },
        }),
        prisma.lead.findMany({
            where: { workspaceId },
            orderBy: { score: "asc" },
            take: 10,
            select: { id: true, firstName: true, lastName: true, email: true, score: true, lifecycleStage: true, scoreUpdatedAt: true },
        }),
    ]);
    res.json({ data: { top: topLeads, bottom: bottomLeads }, meta: { timestamp: new Date().toISOString() }, error: null });
});
