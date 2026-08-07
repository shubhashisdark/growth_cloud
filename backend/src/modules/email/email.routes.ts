import { Router } from "express";
import { z } from "zod";

import { requireAuth, requireWorkspaceMember } from "../../middleware/auth.middleware.js";
import { sendError, sendSuccess } from "../../lib/response.js";
import { EmailCampaignsService } from "./email.campaigns.service.js";

const service = new EmailCampaignsService();

const templateSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  htmlContent: z.string().min(1),
  textContent: z.string().optional(),
  variables: z.array(z.string()).optional(),
});

const campaignSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  fromName: z.string().optional(),
  fromEmail: z.string().email().optional(),
  templateId: z.string().optional(),
  scheduledAt: z.string().optional(),
});

const singleSendSchema = z.object({
  to: z.string().email(),
  recipientName: z.string().optional(),
  subject: z.string().min(1),
  html: z.string().min(1),
  text: z.string().optional(),
  variables: z.record(z.string(), z.string()).optional(),
});

const suppressionSchema = z.object({
  email: z.string().email(),
  reason: z.string().optional().default("unsubscribe"),
});

export const emailRouter = Router();
export const trackingAliasRouter = Router();

// ─────────────────────────────────────────────
// PUBLIC TRACKING ENDPOINTS (No auth required)
// ─────────────────────────────────────────────

async function handleOpenTracking(request: import("express").Request, response: import("express").Response) {
  const campaignId = String(request.query.campaignId || "");
  const messageId = String(request.query.messageId || "");
  const recipientId = String(request.query.recipientId || "");
  const recipientEmail = String(request.query.recipientEmail || "");

  if (campaignId) {
    await service.recordOpenEvent(campaignId, messageId, recipientId, recipientEmail);
  }

  // 1x1 transparent GIF image
  const pixel = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64",
  );
  response.setHeader("Content-Type", "image/gif");
  response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  response.send(pixel);
}

async function handleClickTracking(request: import("express").Request, response: import("express").Response) {
  const campaignId = String(request.query.campaignId || "");
  const messageId = String(request.query.messageId || "");
  const recipientId = String(request.query.recipientId || "");
  const recipientEmail = String(request.query.recipientEmail || "");
  const targetUrl = String(request.query.url || "/");

  if (campaignId) {
    await service.recordClickEvent(campaignId, messageId, recipientId, targetUrl, recipientEmail);
  }

  return response.redirect(302, targetUrl);
}

// Canonical paths: /api/v1/email/tracking/*
emailRouter.get("/tracking/open", handleOpenTracking);
emailRouter.get("/tracking/click", handleClickTracking);

// Legacy alias: /api/v1/tracking/*
trackingAliasRouter.get("/open", handleOpenTracking);
trackingAliasRouter.get("/click", handleClickTracking);

// Unsubscribe Link
emailRouter.get("/tracking/unsubscribe", async (request, response) => {
  const email = String(request.query.email || "");
  const workspaceId = String(request.query.workspaceId || "");

  if (email && workspaceId) {
    await service.addSuppression(workspaceId, email, "unsubscribe");
  }

  response.setHeader("Content-Type", "text/html; charset=utf-8");
  response.send(`
    <!DOCTYPE html>
    <html>
      <head><title>Unsubscribed</title></head>
      <body style="font-family:sans-serif;background:#0F172A;color:#F8FAFC;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
        <div style="text-align:center;max-width:400px;padding:32px;background:#1E293B;border-radius:16px;border:1px solid rgba(255,255,255,0.1);">
          <h2 style="color:#38BDF8;margin-top:0;">You've been unsubscribed</h2>
          <p style="color:#94A3B8;font-size:14px;">You will no longer receive marketing emails sent to <strong>${email}</strong>.</p>
        </div>
      </body>
    </html>
  `);
});


emailRouter.get(
  "/templates",
  requireAuth,
  requireWorkspaceMember(),
  async (request, response) => {
    const templates = await service.listTemplates(request.workspace!.workspaceId);
    return sendSuccess(response, { items: templates });
  },
);

emailRouter.post(
  "/templates",
  requireAuth,
  requireWorkspaceMember(["super_admin", "admin", "marketer"]),
  async (request, response) => {
    const payload = templateSchema.parse(request.body);
    const template = await service.createTemplate(payload, request.workspace!.workspaceId);
    return response.status(201).json({ data: template, meta: { timestamp: new Date().toISOString() }, error: null });
  },
);

emailRouter.patch(
  "/templates/:id",
  requireAuth,
  requireWorkspaceMember(["super_admin", "admin", "marketer"]),
  async (request, response) => {
    const templateId = String(request.params.id);
    const payload = templateSchema.partial().parse(request.body);
    const updated = await service.updateTemplate(templateId, payload, request.workspace!.workspaceId);
    if (!updated) return sendError(response, "NOT_FOUND", "Template not found", 404);
    return sendSuccess(response, updated);
  },
);

emailRouter.delete(
  "/templates/:id",
  requireAuth,
  requireWorkspaceMember(["super_admin", "admin"]),
  async (request, response) => {
    const templateId = String(request.params.id);
    const result = await service.deleteTemplate(templateId, request.workspace!.workspaceId);
    if (!result) return sendError(response, "NOT_FOUND", "Template not found", 404);
    return sendSuccess(response, result);
  },
);



emailRouter.get(
  "/campaigns",
  requireAuth,
  requireWorkspaceMember(),
  async (request, response) => {
    const campaigns = await service.listCampaigns(request.workspace!.workspaceId);
    return sendSuccess(response, { items: campaigns });
  },
);

emailRouter.get(
  "/campaigns/:id",
  requireAuth,
  requireWorkspaceMember(),
  async (request, response) => {
    const campaignId = String(request.params.id);
    const campaign = await service.getCampaign(campaignId, request.workspace!.workspaceId);
    if (!campaign) return sendError(response, "NOT_FOUND", "Campaign not found", 404);
    return sendSuccess(response, campaign);
  },
);

emailRouter.post(
  "/campaigns",
  requireAuth,
  requireWorkspaceMember(["super_admin", "admin", "marketer"]),
  async (request, response) => {
    const payload = campaignSchema.parse(request.body);
    const campaign = await service.createCampaign(payload, request.workspace!.workspaceId);
    return response.status(201).json({ data: campaign, meta: { timestamp: new Date().toISOString() }, error: null });
  },
);

emailRouter.patch(
  "/campaigns/:id",
  requireAuth,
  requireWorkspaceMember(["super_admin", "admin", "marketer"]),
  async (request, response) => {
    const campaignId = String(request.params.id);
    const payload = campaignSchema.partial().parse(request.body);
    const updated = await service.updateCampaign(campaignId, payload, request.workspace!.workspaceId);
    if (!updated) return sendError(response, "NOT_FOUND", "Campaign not found", 404);
    return sendSuccess(response, updated);
  },
);

emailRouter.post(
  "/campaigns/:id/send",
  requireAuth,
  requireWorkspaceMember(["super_admin", "admin", "marketer"]),
  async (request, response) => {
    const campaignId = String(request.params.id);
    try {
      const result = await service.sendCampaign(campaignId, request.workspace!.workspaceId);
      if (!result) return sendError(response, "NOT_FOUND", "Campaign not found", 404);
      return sendSuccess(response, result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send campaign";
      const statusCode =
        error instanceof Error && "statusCode" in error && typeof (error as { statusCode?: unknown }).statusCode === "number"
          ? (error as { statusCode: number }).statusCode
          : 500;
      return sendError(response, statusCode === 400 ? "NO_RECIPIENTS" : "SEND_FAILED", message, statusCode);
    }
  },
);

emailRouter.delete(
  "/campaigns/:id",
  requireAuth,
  requireWorkspaceMember(["super_admin", "admin"]),
  async (request, response) => {
    const campaignId = String(request.params.id);
    const result = await service.deleteCampaign(campaignId, request.workspace!.workspaceId);
    if (!result) return sendError(response, "NOT_FOUND", "Campaign not found", 404);
    return sendSuccess(response, result);
  },
);

// ─────────────────────────────────────────────
// SINGLE SEND & SUPPRESSION ROUTES
// ─────────────────────────────────────────────

emailRouter.post(
  "/send-single",
  requireAuth,
  requireWorkspaceMember(["super_admin", "admin", "marketer", "developer"]),
  async (request, response) => {
    const payload = singleSendSchema.parse(request.body);
    const result = await service.sendSingleEmail(payload, request.workspace!.workspaceId);
    return response.status(202).json({ data: result, meta: { timestamp: new Date().toISOString() }, error: null });
  },
);

emailRouter.get(
  "/suppressions",
  requireAuth,
  requireWorkspaceMember(),
  async (request, response) => {
    const suppressions = await service.listSuppressions(request.workspace!.workspaceId);
    return sendSuccess(response, { items: suppressions });
  },
);

emailRouter.post(
  "/suppressions",
  requireAuth,
  requireWorkspaceMember(["super_admin", "admin", "marketer"]),
  async (request, response) => {
    const payload = suppressionSchema.parse(request.body);
    const suppression = await service.addSuppression(request.workspace!.workspaceId, payload.email, payload.reason);
    return response.status(201).json({ data: suppression, meta: { timestamp: new Date().toISOString() }, error: null });
  },
);

emailRouter.delete(
  "/suppressions/:id",
  requireAuth,
  requireWorkspaceMember(["super_admin", "admin"]),
  async (request, response) => {
    const suppressionId = String(request.params.id);
    const result = await service.removeSuppression(suppressionId, request.workspace!.workspaceId);
    if (!result) return sendError(response, "NOT_FOUND", "Suppression record not found", 404);
    return sendSuccess(response, result);
  },
);
