import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../data/prisma.js";
import { requireAuth, requireWorkspaceMember } from "../../middleware/auth.middleware.js";
import { computeSegmentMembers, matchesSegmentRules } from "../workflows/workflow.executor.js";

const conditionSchema = z.object({
  field: z.enum(["score", "lifecycleStage", "status", "email", "company", "tags", "source", "createdAt"]),
  operator: z.enum(["eq", "neq", "gt", "gte", "lt", "lte", "contains", "not_contains", "in", "not_in"]),
  value: z.union([z.string(), z.number(), z.array(z.string())]),
});

const rulesSchema = z.object({
  logic: z.enum(["AND", "OR"]).default("AND"),
  conditions: z.array(conditionSchema).default([]),
});

const segmentSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().min(2),
  description: z.string().optional(),
  type: z.enum(["dynamic", "static"]),
  status: z.enum(["active", "paused", "archived"]).default("active"),
  rules: rulesSchema.default({ logic: "AND", conditions: [] }),
});

const segmentUpdateSchema = segmentSchema.partial().omit({ workspaceId: true });

const previewSchema = z.object({
  workspaceId: z.string().min(1),
  rules: rulesSchema,
});

export const segmentsRouter = Router();

// GET /api/v1/segments?workspaceId=
segmentsRouter.get("/", requireAuth, requireWorkspaceMember(), async (req, res) => {
  const workspaceId = req.workspace!.workspaceId;
  const segments = await prisma.segment.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });

  res.json({
    data: {
      items: segments.map((s) => ({
        id: s.id,
        workspaceId: s.workspaceId,
        name: s.name,
        description: s.description,
        type: s.type,
        status: s.status,
        rules: JSON.parse(s.rulesJson),
        memberCount: s.memberCount,
        lastComputedAt: s.lastComputedAt,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
    },
    meta: { total: segments.length, timestamp: new Date().toISOString() },
    error: null,
  });
});

// GET /api/v1/segments/:segmentId
segmentsRouter.get("/:segmentId", requireAuth, requireWorkspaceMember(), async (req, res) => {
  const workspaceId = req.workspace!.workspaceId;
  const segmentId = req.params.segmentId as string;
  const segment = await prisma.segment.findFirst({
    where: { id: segmentId, workspaceId },
  });
  if (!segment) return res.status(404).json({ data: null, error: { code: "NOT_FOUND", message: "Segment not found" }, meta: {} });

  res.json({
    data: {
      id: segment.id,
      workspaceId: segment.workspaceId,
      name: segment.name,
      description: segment.description,
      type: segment.type,
      status: segment.status,
      rules: JSON.parse(segment.rulesJson),
      memberCount: segment.memberCount,
      lastComputedAt: segment.lastComputedAt,
      createdAt: segment.createdAt,
      updatedAt: segment.updatedAt,
    },
    meta: { timestamp: new Date().toISOString() },
    error: null,
  });
});

// POST /api/v1/segments
segmentsRouter.post("/", requireAuth, requireWorkspaceMember(), async (req, res) => {
  const workspaceId = req.workspace!.workspaceId;
  const payload = segmentSchema.parse(req.body);

  const segment = await prisma.segment.create({
    data: {
      id: `seg_${randomUUID().slice(0, 10)}`,
      workspaceId,
      name: payload.name,
      description: payload.description,
      type: payload.type,
      status: payload.status,
      rulesJson: JSON.stringify(payload.rules),
    },
  });

  // Auto-compute membership for dynamic segments
  let memberCount = 0;
  if (payload.type === "dynamic" && payload.status === "active") {
    const memberIds = await computeSegmentMembers(segment.id, workspaceId, payload.rules as Record<string, unknown>);
    memberCount = memberIds.length;
    await prisma.segment.update({
      where: { id: segment.id },
      data: { memberCount, lastComputedAt: new Date() },
    });
  }

  res.status(201).json({
    data: { ...segment, rules: payload.rules, memberCount, rulesJson: undefined },
    meta: { timestamp: new Date().toISOString() },
    error: null,
  });
});

// PATCH /api/v1/segments/:segmentId
segmentsRouter.patch("/:segmentId", requireAuth, requireWorkspaceMember(), async (req, res) => {
  const workspaceId = req.workspace!.workspaceId;
  const segmentId = req.params.segmentId as string;
  const payload = segmentUpdateSchema.parse(req.body);

  const existing = await prisma.segment.findFirst({ where: { id: segmentId, workspaceId } });
  if (!existing) return res.status(404).json({ data: null, error: { code: "NOT_FOUND", message: "Segment not found" }, meta: {} });

  const rules = payload.rules ?? JSON.parse(existing.rulesJson);
  const updated = await prisma.segment.update({
    where: { id: segmentId },
    data: {
      name: payload.name ?? existing.name,
      description: payload.description ?? existing.description,
      type: payload.type ?? existing.type,
      status: payload.status ?? existing.status,
      rulesJson: JSON.stringify(rules),
    },
  });

  // Re-compute membership if dynamic
  let memberCount = updated.memberCount;
  if (updated.type === "dynamic") {
    const memberIds = await computeSegmentMembers(updated.id, workspaceId, rules as Record<string, unknown>);
    memberCount = memberIds.length;
    await prisma.segment.update({
      where: { id: updated.id },
      data: { memberCount, lastComputedAt: new Date() },
    });
  }

  res.json({
    data: { id: updated.id, name: updated.name, type: updated.type, status: updated.status, rules, memberCount },
    meta: { timestamp: new Date().toISOString() },
    error: null,
  });
});

// DELETE /api/v1/segments/:segmentId
segmentsRouter.delete("/:segmentId", requireAuth, requireWorkspaceMember(), async (req, res) => {
  const workspaceId = req.workspace!.workspaceId;
  const segmentId = req.params.segmentId as string;
  const existing = await prisma.segment.findFirst({ where: { id: segmentId, workspaceId } });
  if (!existing) return res.status(404).json({ data: null, error: { code: "NOT_FOUND", message: "Segment not found" }, meta: {} });

  await prisma.segment.delete({ where: { id: segmentId } });
  res.json({ data: { deleted: true }, meta: { timestamp: new Date().toISOString() }, error: null });
});

// POST /api/v1/segments/preview — live audience count
segmentsRouter.post("/preview", requireAuth, requireWorkspaceMember(), async (req, res) => {
  const workspaceId = req.workspace!.workspaceId;
  const payload = previewSchema.parse(req.body);

  const leads = await prisma.lead.findMany({ where: { workspaceId } });
  let matchCount = 0;
  const matchedSample: Array<{ id: string; email: string; score: number; lifecycleStage: string }> = [];

  for (const lead of leads) {
    const ok = await matchesSegmentRules(lead as any, payload.rules as Record<string, unknown>);
    if (ok) {
      matchCount++;
      if (matchedSample.length < 5) {
        matchedSample.push({ id: lead.id, email: lead.email, score: lead.score, lifecycleStage: lead.lifecycleStage });
      }
    }
  }

  res.json({
    data: { workspaceId, matchCount, total: leads.length, sample: matchedSample },
    meta: { timestamp: new Date().toISOString() },
    error: null,
  });
});

// GET /api/v1/segments/:segmentId/members
segmentsRouter.get("/:segmentId/members", requireAuth, requireWorkspaceMember(), async (req, res) => {
  const workspaceId = req.workspace!.workspaceId;
  const segmentId = req.params.segmentId as string;
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(100, Number(req.query.limit ?? 25));

  const segment = await prisma.segment.findFirst({ where: { id: segmentId, workspaceId } });
  if (!segment) return res.status(404).json({ data: null, error: { code: "NOT_FOUND", message: "Segment not found" }, meta: {} });

  if (segment.type === "dynamic") {
    // Compute dynamically
    const rules = JSON.parse(segment.rulesJson) as Record<string, unknown>;
    const leads = await prisma.lead.findMany({ where: { workspaceId } });
    const matched: typeof leads = [];
    for (const lead of leads) {
      const ok = await matchesSegmentRules(lead as any, rules);
      if (ok) matched.push(lead);
    }
    const total = matched.length;
    const page_leads = matched.slice((page - 1) * limit, page * limit);
    return res.json({
      data: {
        items: page_leads.map((l) => ({ id: l.id, email: l.email, firstName: l.firstName, lastName: l.lastName, score: l.score, lifecycleStage: l.lifecycleStage })),
      },
      meta: { total, page, limit, pages: Math.ceil(total / limit), timestamp: new Date().toISOString() },
      error: null,
    });
  }

  // Static segment — from SegmentMembership
  const [memberships, total] = await Promise.all([
    prisma.segmentMembership.findMany({
      where: { segmentId: segment.id },
      include: { lead: true },
      orderBy: { addedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.segmentMembership.count({ where: { segmentId: segment.id } }),
  ]);

  res.json({
    data: {
      items: memberships.map((m) => ({
        id: m.lead.id,
        email: m.lead.email,
        firstName: m.lead.firstName,
        lastName: m.lead.lastName,
        score: m.lead.score,
        lifecycleStage: m.lead.lifecycleStage,
        addedAt: m.addedAt,
      })),
    },
    meta: { total, page, limit, pages: Math.ceil(total / limit), timestamp: new Date().toISOString() },
    error: null,
  });
});

// POST /api/v1/segments/:segmentId/members — add lead to static segment
segmentsRouter.post("/:segmentId/members", requireAuth, requireWorkspaceMember(), async (req, res) => {
  const workspaceId = req.workspace!.workspaceId;
  const segmentId = req.params.segmentId as string;
  const { leadId } = z.object({ leadId: z.string().min(1) }).parse(req.body);

  const segment = await prisma.segment.findFirst({ where: { id: segmentId, workspaceId, type: "static" } });
  if (!segment) return res.status(404).json({ data: null, error: { code: "NOT_FOUND", message: "Static segment not found" }, meta: {} });

  const lead = await prisma.lead.findFirst({ where: { id: leadId, workspaceId } });
  if (!lead) return res.status(404).json({ data: null, error: { code: "NOT_FOUND", message: "Lead not found" }, meta: {} });

  await prisma.segmentMembership.upsert({
    where: { segmentId_leadId: { segmentId: segment.id, leadId } },
    update: {},
    create: { id: `sm_${randomUUID().slice(0, 8)}`, segmentId: segment.id, leadId },
  });

  const count = await prisma.segmentMembership.count({ where: { segmentId: segment.id } });
  await prisma.segment.update({ where: { id: segment.id }, data: { memberCount: count } });

  res.json({ data: { added: true, memberCount: count }, meta: { timestamp: new Date().toISOString() }, error: null });
});

// DELETE /api/v1/segments/:segmentId/members/:leadId
segmentsRouter.delete("/:segmentId/members/:leadId", requireAuth, requireWorkspaceMember(), async (req, res) => {
  const workspaceId = req.workspace!.workspaceId;
  const segmentId = req.params.segmentId as string;
  const leadId = req.params.leadId as string;
  const segment = await prisma.segment.findFirst({ where: { id: segmentId, workspaceId } });
  if (!segment) return res.status(404).json({ data: null, error: { code: "NOT_FOUND", message: "Segment not found" }, meta: {} });

  await prisma.segmentMembership.deleteMany({
    where: { segmentId: segment.id, leadId },
  });

  const count = await prisma.segmentMembership.count({ where: { segmentId: segment.id } });
  await prisma.segment.update({ where: { id: segment.id }, data: { memberCount: count } });

  res.json({ data: { removed: true, memberCount: count }, meta: { timestamp: new Date().toISOString() }, error: null });
});

// POST /api/v1/segments/:segmentId/compute — recompute dynamic segment membership
segmentsRouter.post("/:segmentId/compute", requireAuth, requireWorkspaceMember(), async (req, res) => {
  const workspaceId = req.workspace!.workspaceId;
  const segmentId = req.params.segmentId as string;
  const segment = await prisma.segment.findFirst({ where: { id: segmentId, workspaceId, type: "dynamic" } });
  if (!segment) return res.status(404).json({ data: null, error: { code: "NOT_FOUND", message: "Dynamic segment not found" }, meta: {} });

  const rules = JSON.parse(segment.rulesJson) as Record<string, unknown>;
  const memberIds = await computeSegmentMembers(segment.id, workspaceId, rules);

  await prisma.segment.update({
    where: { id: segment.id },
    data: { memberCount: memberIds.length, lastComputedAt: new Date() },
  });

  res.json({
    data: { memberCount: memberIds.length, lastComputedAt: new Date().toISOString() },
    meta: { timestamp: new Date().toISOString() },
    error: null,
  });
});
