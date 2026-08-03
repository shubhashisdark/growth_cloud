import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../data/prisma.js";
import { requireAuth, requireWorkspaceMember } from "../../middleware/auth.middleware.js";
import { executeWorkflow } from "./workflow.service.js";

const workflowSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().min(2),
  description: z.string().optional(),
  status: z.enum(["active", "paused", "archived"]).default("paused"),
  triggerType: z.string().min(2),
  definition: z.object({
    trigger: z.object({ type: z.string(), config: z.record(z.string(), z.any()).optional() }),
    steps: z.array(
      z.object({
        index: z.number(),
        type: z.enum(["trigger", "condition", "action", "delay"]),
        actionType: z.string().optional(),
        conditionField: z.string().optional(),
        conditionOperator: z.string().optional(),
        conditionValue: z.any().optional(),
        delayMinutes: z.number().optional(),
        config: z.record(z.string(), z.any()).optional(),
      })
    ),
  }),
});

const workflowUpdateSchema = workflowSchema.partial().omit({ workspaceId: true });

const triggerSchema = z.object({
  leadId: z.string().optional(),
  input: z.record(z.string(), z.any()).optional(),
});

export const workflowsRouter = Router();

// GET /api/v1/workflows?workspaceId=
workflowsRouter.get("/", requireAuth, requireWorkspaceMember(), async (req, res) => {
  const workspaceId = req.workspace!.workspaceId;
  const workflows = await prisma.workflow.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });

  res.json({
    data: {
      items: workflows.map((w) => ({
        id: w.id,
        workspaceId: w.workspaceId,
        name: w.name,
        description: w.description,
        status: w.status,
        triggerType: w.triggerType,
        stepCount: w.stepCount,
        runCount: w.runCount,
        errorCount: w.errorCount,
        lastRunAt: w.lastRunAt,
        definition: JSON.parse(w.definitionJson),
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
      })),
    },
    meta: { total: workflows.length, timestamp: new Date().toISOString() },
    error: null,
  });
});

// GET /api/v1/workflows/:workflowId
workflowsRouter.get("/:workflowId", requireAuth, requireWorkspaceMember(), async (req, res) => {
  const workspaceId = req.workspace!.workspaceId;
  const workflowId = req.params.workflowId as string;
  const wf = await prisma.workflow.findFirst({
    where: { id: workflowId, workspaceId },
  });
  if (!wf) return res.status(404).json({ data: null, error: { code: "NOT_FOUND", message: "Workflow not found" }, meta: {} });

  res.json({
    data: {
      id: wf.id,
      workspaceId: wf.workspaceId,
      name: wf.name,
      description: wf.description,
      status: wf.status,
      triggerType: wf.triggerType,
      stepCount: wf.stepCount,
      runCount: wf.runCount,
      errorCount: wf.errorCount,
      lastRunAt: wf.lastRunAt,
      definition: JSON.parse(wf.definitionJson),
      createdAt: wf.createdAt,
      updatedAt: wf.updatedAt,
    },
    meta: { timestamp: new Date().toISOString() },
    error: null,
  });
});

// POST /api/v1/workflows
workflowsRouter.post("/", requireAuth, requireWorkspaceMember(), async (req, res) => {
  const payload = workflowSchema.parse(req.body);
  const workspaceId = req.workspace!.workspaceId;

  const created = await prisma.workflow.create({
    data: {
      id: `wf_${randomUUID().slice(0, 10)}`,
      workspaceId,
      name: payload.name,
      description: payload.description,
      status: payload.status,
      triggerType: payload.triggerType,
      stepCount: payload.definition.steps.length,
      definitionJson: JSON.stringify(payload.definition),
    },
  });

  res.status(201).json({
    data: {
      id: created.id,
      workspaceId: created.workspaceId,
      name: created.name,
      description: created.description,
      status: created.status,
      triggerType: created.triggerType,
      stepCount: created.stepCount,
      runCount: created.runCount,
      errorCount: created.errorCount,
      lastRunAt: created.lastRunAt,
      definition: JSON.parse(created.definitionJson),
      createdAt: created.createdAt,
    },
    meta: { timestamp: new Date().toISOString() },
    error: null,
  });
});

// PATCH /api/v1/workflows/:workflowId
workflowsRouter.patch("/:workflowId", requireAuth, requireWorkspaceMember(), async (req, res) => {
  const workspaceId = req.workspace!.workspaceId;
  const workflowId = req.params.workflowId as string;
  const payload = workflowUpdateSchema.parse(req.body);

  const existing = await prisma.workflow.findFirst({ where: { id: workflowId, workspaceId } });
  if (!existing) return res.status(404).json({ data: null, error: { code: "NOT_FOUND", message: "Workflow not found" }, meta: {} });

  const updated = await prisma.workflow.update({
    where: { id: workflowId },
    data: {
      name: payload.name ?? existing.name,
      description: payload.description ?? existing.description,
      status: payload.status ?? existing.status,
      triggerType: payload.triggerType ?? existing.triggerType,
      stepCount: payload.definition ? payload.definition.steps.length : existing.stepCount,
      definitionJson: payload.definition ? JSON.stringify(payload.definition) : existing.definitionJson,
    },
  });

  res.json({
    data: {
      id: updated.id,
      name: updated.name,
      status: updated.status,
      triggerType: updated.triggerType,
      stepCount: updated.stepCount,
      definition: JSON.parse(updated.definitionJson),
    },
    meta: { timestamp: new Date().toISOString() },
    error: null,
  });
});

// DELETE /api/v1/workflows/:workflowId
workflowsRouter.delete("/:workflowId", requireAuth, requireWorkspaceMember(), async (req, res) => {
  const workspaceId = req.workspace!.workspaceId;
  const workflowId = req.params.workflowId as string;
  const existing = await prisma.workflow.findFirst({ where: { id: workflowId, workspaceId } });
  if (!existing) return res.status(404).json({ data: null, error: { code: "NOT_FOUND", message: "Workflow not found" }, meta: {} });

  await prisma.workflow.delete({ where: { id: workflowId } });
  res.json({ data: { deleted: true }, meta: { timestamp: new Date().toISOString() }, error: null });
});

// GET /api/v1/workflows/:workflowId/runs
workflowsRouter.get("/:workflowId/runs", requireAuth, requireWorkspaceMember(), async (req, res) => {
  const workspaceId = req.workspace!.workspaceId;
  const workflowId = req.params.workflowId as string;
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(50, Number(req.query.limit ?? 20));

  const wf = await prisma.workflow.findFirst({ where: { id: workflowId, workspaceId } });
  if (!wf) return res.status(404).json({ data: null, error: { code: "NOT_FOUND", message: "Workflow not found" }, meta: {} });

  const [runs, total] = await Promise.all([
    prisma.workflowRun.findMany({
      where: { workflowId },
      orderBy: { startedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.workflowRun.count({ where: { workflowId } }),
  ]);

  res.json({
    data: {
      items: runs.map((r) => ({
        id: r.id,
        workflowId: r.workflowId,
        leadId: r.leadId,
        status: r.status,
        triggerEvent: r.triggerEvent,
        errorMessage: r.errorMessage,
        startedAt: r.startedAt,
        finishedAt: r.finishedAt,
        durationMs: r.finishedAt ? r.finishedAt.getTime() - r.startedAt.getTime() : null,
      })),
    },
    meta: { total, page, limit, pages: Math.ceil(total / limit), timestamp: new Date().toISOString() },
    error: null,
  });
});

// GET /api/v1/workflows/:workflowId/runs/:runId
workflowsRouter.get("/:workflowId/runs/:runId", requireAuth, requireWorkspaceMember(), async (req, res) => {
  const workflowId = req.params.workflowId as string;
  const runId = req.params.runId as string;
  const run = await prisma.workflowRun.findUnique({
    where: { id: runId },
    include: { stepLogs: { orderBy: { stepIndex: "asc" } } },
  });
  if (!run || run.workflowId !== workflowId) {
    return res.status(404).json({ data: null, error: { code: "NOT_FOUND", message: "Run not found" }, meta: {} });
  }

  const stepLogsArr = (run as any).stepLogs as Array<{ id: string; stepIndex: number; stepType: string; status: string; inputJson: string; outputJson: string; errorMessage: string | null; durationMs: number | null; createdAt: Date }>;

  res.json({
    data: {
      id: run.id,
      workflowId: run.workflowId,
      leadId: run.leadId,
      status: run.status,
      triggerEvent: run.triggerEvent,
      errorMessage: run.errorMessage,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
      durationMs: run.finishedAt ? run.finishedAt.getTime() - r_startedAt_ms(run) : null,
      stepLogs: (stepLogsArr || []).map((s) => ({
        id: s.id,
        stepIndex: s.stepIndex,
        stepType: s.stepType,
        status: s.status,
        input: JSON.parse(s.inputJson || "{}"),
        output: JSON.parse(s.outputJson || "{}"),
        errorMessage: s.errorMessage,
        durationMs: s.durationMs,
        createdAt: s.createdAt,
      })),
    },
    meta: { timestamp: new Date().toISOString() },
    error: null,
  });
});

function r_startedAt_ms(run: { startedAt: Date }) {
  return run.startedAt ? run.startedAt.getTime() : Date.now();
}

// POST /api/v1/workflows/:workflowId/trigger
workflowsRouter.post("/:workflowId/trigger", requireAuth, requireWorkspaceMember(), async (req, res) => {
  const workspaceId = req.workspace!.workspaceId;
  const workflowId = req.params.workflowId as string;
  const payload = triggerSchema.parse(req.body);

  const wf = await prisma.workflow.findFirst({ where: { id: workflowId, workspaceId } });
  if (!wf) return res.status(404).json({ data: null, error: { code: "NOT_FOUND", message: "Workflow not found" }, meta: {} });

  const result = await executeWorkflow(wf.id, payload.leadId ?? null, "manual_trigger", payload.input ?? {});

  res.json({
    data: result,
    meta: { timestamp: new Date().toISOString() },
    error: null,
  });
});
