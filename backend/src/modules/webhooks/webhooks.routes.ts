import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireWorkspaceMember } from "../../middleware/auth.middleware.js";
import {
  createSubscription,
  listSubscriptions,
  getSubscription,
  updateSubscription,
  deleteSubscription,
  rotateSubscriptionSecret,
  listDeliveryLogs,
  replayDeliveryLog,
  dispatchWebhookEvent,
} from "./webhook.service.js";

export const webhooksRouter = Router();

const createSchema = z.object({
  name: z.string().min(2),
  targetUrl: z.string().url("Invalid target URL"),
  events: z.array(z.string()).min(1, "Select at least one event"),
});

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  targetUrl: z.string().url().optional(),
  events: z.array(z.string()).min(1).optional(),
  status: z.enum(["active", "paused", "disabled"]).optional(),
});

const testEventSchema = z.object({
  event: z.string().default("test.event"),
  payload: z.record(z.string(), z.any()).optional().default({ hello: "world" }),
});

// GET /api/v1/webhooks
webhooksRouter.get("/", requireAuth, requireWorkspaceMember(), async (req, res) => {
  const workspaceId = req.workspace!.workspaceId;
  const items = await listSubscriptions(workspaceId);

  res.json({
    data: { items },
    meta: { total: items.length, timestamp: new Date().toISOString() },
    error: null,
  });
});

// POST /api/v1/webhooks
webhooksRouter.post("/", requireAuth, requireWorkspaceMember(), async (req, res) => {
  const workspaceId = req.workspace!.workspaceId;
  const payload = createSchema.parse(req.body);

  const created = await createSubscription({
    workspaceId,
    name: payload.name,
    targetUrl: payload.targetUrl,
    events: payload.events,
  });

  res.status(201).json({
    data: created,
    meta: { timestamp: new Date().toISOString() },
    error: null,
  });
});

// GET /api/v1/webhooks/:id
webhooksRouter.get("/:id", requireAuth, requireWorkspaceMember(), async (req, res) => {
  const workspaceId = req.workspace!.workspaceId;
  const subId = req.params.id as string;
  const item = await getSubscription(subId, workspaceId);

  if (!item) {
    return res.status(404).json({ data: null, error: { code: "NOT_FOUND", message: "Webhook subscription not found" }, meta: {} });
  }

  res.json({
    data: item,
    meta: { timestamp: new Date().toISOString() },
    error: null,
  });
});

// PATCH /api/v1/webhooks/:id
webhooksRouter.patch("/:id", requireAuth, requireWorkspaceMember(), async (req, res) => {
  const workspaceId = req.workspace!.workspaceId;
  const subId = req.params.id as string;
  const payload = updateSchema.parse(req.body);

  const updated = await updateSubscription(subId, workspaceId, payload);
  if (!updated) {
    return res.status(404).json({ data: null, error: { code: "NOT_FOUND", message: "Webhook subscription not found" }, meta: {} });
  }

  res.json({
    data: updated,
    meta: { timestamp: new Date().toISOString() },
    error: null,
  });
});

// DELETE /api/v1/webhooks/:id
webhooksRouter.delete("/:id", requireAuth, requireWorkspaceMember(), async (req, res) => {
  const workspaceId = req.workspace!.workspaceId;
  const subId = req.params.id as string;
  const deleted = await deleteSubscription(subId, workspaceId);

  if (!deleted) {
    return res.status(404).json({ data: null, error: { code: "NOT_FOUND", message: "Webhook subscription not found" }, meta: {} });
  }

  res.json({
    data: { deleted: true },
    meta: { timestamp: new Date().toISOString() },
    error: null,
  });
});

// POST /api/v1/webhooks/:id/rotate-secret
webhooksRouter.post("/:id/rotate-secret", requireAuth, requireWorkspaceMember(), async (req, res) => {
  const workspaceId = req.workspace!.workspaceId;
  const subId = req.params.id as string;
  const updated = await rotateSubscriptionSecret(subId, workspaceId);

  if (!updated) {
    return res.status(404).json({ data: null, error: { code: "NOT_FOUND", message: "Webhook subscription not found" }, meta: {} });
  }

  res.json({
    data: updated,
    meta: { timestamp: new Date().toISOString() },
    error: null,
  });
});

// GET /api/v1/webhooks/:id/deliveries
webhooksRouter.get("/:id/deliveries", requireAuth, requireWorkspaceMember(), async (req, res) => {
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(100, Number(req.query.limit ?? 20));
  const subId = req.params.id as string;

  const result = await listDeliveryLogs(subId, page, limit);

  res.json({
    data: result,
    meta: { timestamp: new Date().toISOString() },
    error: null,
  });
});

// POST /api/v1/webhooks/deliveries/:deliveryId/replay
webhooksRouter.post("/deliveries/:deliveryId/replay", requireAuth, requireWorkspaceMember(), async (req, res) => {
  try {
    const deliveryId = req.params.deliveryId as string;
    const log = await replayDeliveryLog(deliveryId);
    res.json({
      data: log,
      meta: { timestamp: new Date().toISOString() },
      error: null,
    });
  } catch (err) {
    res.status(400).json({
      data: null,
      error: { code: "REPLAY_FAILED", message: err instanceof Error ? err.message : "Replay failed" },
      meta: {},
    });
  }
});

// POST /api/v1/webhooks/test-dispatch
webhooksRouter.post("/test-dispatch", requireAuth, requireWorkspaceMember(), async (req, res) => {
  const workspaceId = req.workspace!.workspaceId;
  const { event, payload } = testEventSchema.parse(req.body);

  const result = await dispatchWebhookEvent(workspaceId, event, payload);

  res.json({
    data: result,
    meta: { timestamp: new Date().toISOString() },
    error: null,
  });
});
