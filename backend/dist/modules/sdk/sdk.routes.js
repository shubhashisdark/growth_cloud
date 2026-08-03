import { randomUUID, createHash } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../data/prisma.js";
import { triggerWorkflowsForEvent } from "../workflows/workflow.queue.js";
import { dispatchWebhookEvent } from "../webhooks/webhook.service.js";
function hashKey(key) {
    return createHash("sha256").update(key).digest("hex");
}
export const sdkRouter = Router();
// Middleware to validate Public API Key from SDK
export async function requirePublicKey(req, res, next) {
    const publicKeyHeader = req.headers["x-growthcloud-public-key"] || req.headers["authorization"]?.replace("Bearer ", "");
    if (!publicKeyHeader) {
        return res.status(401).json({
            data: null,
            error: { code: "UNAUTHORIZED", message: "X-GrowthCloud-Public-Key header is required" },
            meta: { timestamp: new Date().toISOString() },
        });
    }
    // Look up by prefix (first 16 chars) + keyHash — same pattern as authenticateApiKey
    const keyHash = hashKey(publicKeyHeader);
    const prefix = publicKeyHeader.slice(0, 16);
    const apiKey = await prisma.apiKey.findFirst({
        where: {
            prefix,
            keyHash,
            type: "public",
            status: "active",
            deletedAt: null,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
    });
    if (!apiKey) {
        return res.status(401).json({
            data: null,
            error: { code: "INVALID_PUBLIC_KEY", message: "Invalid or inactive public API key" },
            meta: { timestamp: new Date().toISOString() },
        });
    }
    // Update telemetry
    void prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date(), usageCount: { increment: 1 } },
    }).catch(() => { });
    req.sdkWorkspaceId = apiKey.workspaceId;
    next();
}
const identifySchema = z.object({
    email: z.string().email(),
    traits: z.record(z.string(), z.any()).optional().default({}),
});
const trackSchema = z.object({
    event: z.string().min(1),
    properties: z.record(z.string(), z.any()).optional().default({}),
});
const leadSyncSchema = z.object({
    email: z.string().email(),
    data: z.record(z.string(), z.any()).optional().default({}),
    // legacy nested format support
    lead: z.object({
        email: z.string().email().optional(),
        firstName: z.string().optional().default(""),
        lastName: z.string().optional().default(""),
        company: z.string().optional().default(""),
        source: z.string().optional().default("sdk"),
        status: z.enum(["active", "archived"]).optional().default("active"),
        lifecycleStage: z.enum(["subscriber", "lead", "mql", "sql", "customer"]).optional().default("lead"),
        customFields: z.record(z.string(), z.any()).optional().default({}),
    }).optional(),
});
const formSchema = z.object({
    formId: z.string().min(1),
    data: z.record(z.string(), z.any()),
});
// POST /api/v1/sdk/identify
sdkRouter.post("/identify", requirePublicKey, async (req, res) => {
    const workspaceId = req.sdkWorkspaceId;
    const { email, traits } = identifySchema.parse(req.body);
    const existing = await prisma.lead.findFirst({ where: { workspaceId, email } });
    let lead;
    if (existing) {
        lead = await prisma.lead.update({
            where: { id: existing.id },
            data: {
                firstName: traits.firstName || existing.firstName,
                lastName: traits.lastName || existing.lastName,
                company: traits.company || existing.company,
                lifecycleStage: traits.lifecycleStage || existing.lifecycleStage,
                customFieldsJson: JSON.stringify({ ...JSON.parse(existing.customFieldsJson), ...traits }),
            },
        });
    }
    else {
        lead = await prisma.lead.create({
            data: {
                id: `lead_${randomUUID().replace(/-/g, "").slice(0, 12)}`,
                workspaceId,
                email,
                firstName: traits.firstName || "",
                lastName: traits.lastName || "",
                company: traits.company || "",
                source: traits.source || "sdk_identify",
                status: "active",
                score: 10,
                lifecycleStage: traits.lifecycleStage || "lead",
                customFieldsJson: JSON.stringify(traits),
            },
        });
    }
    // Trigger workflows & dispatch webhooks
    void triggerWorkflowsForEvent(workspaceId, "lead_created", lead.id, { traits });
    void dispatchWebhookEvent(workspaceId, "lead.updated", { leadId: lead.id, email: lead.email, traits });
    res.json({
        data: { identified: true, leadId: lead.id, email: lead.email },
        meta: { timestamp: new Date().toISOString() },
        error: null,
    });
});
// POST /api/v1/sdk/track
sdkRouter.post("/track", requirePublicKey, async (req, res) => {
    const workspaceId = req.sdkWorkspaceId;
    const { event, properties } = trackSchema.parse(req.body);
    // Record activity
    await prisma.auditLog.create({
        data: {
            id: `audit_${randomUUID().slice(0, 8)}`,
            workspaceId,
            action: `sdk.track:${event}`,
            entityType: "SDKEvent",
            entityId: event,
            metadataJson: JSON.stringify(properties),
        },
    });
    void triggerWorkflowsForEvent(workspaceId, event, null, properties);
    void dispatchWebhookEvent(workspaceId, "event.tracked", { event, properties });
    res.json({
        data: { tracked: true, event },
        meta: { timestamp: new Date().toISOString() },
        error: null,
    });
});
// POST /api/v1/sdk/lead-sync
sdkRouter.post("/lead-sync", requirePublicKey, async (req, res) => {
    const workspaceId = req.sdkWorkspaceId;
    const parsed = leadSyncSchema.parse(req.body);
    // Support both flat { email, data } and nested { lead: { ... } } formats
    const email = parsed.email || parsed.lead?.email || "";
    const data = parsed.data || parsed.lead || {};
    const firstName = data.firstName || "";
    const lastName = data.lastName || "";
    const company = data.company || "";
    const source = data.source || "sdk_sync";
    const lifecycleStage = data.lifecycleStage || "lead";
    if (!email) {
        return res.status(400).json({ data: null, error: { code: "BAD_REQUEST", message: "email is required" }, meta: {} });
    }
    const existing = await prisma.lead.findFirst({ where: { workspaceId, email } });
    let lead;
    if (existing) {
        lead = await prisma.lead.update({
            where: { id: existing.id },
            data: { firstName: firstName || existing.firstName, lastName: lastName || existing.lastName, company: company || existing.company, lifecycleStage },
        });
    }
    else {
        lead = await prisma.lead.create({
            data: {
                id: `lead_${randomUUID().replace(/-/g, "").slice(0, 12)}`,
                workspaceId, email, firstName, lastName, company, source, status: "active", score: 10, lifecycleStage,
                customFieldsJson: JSON.stringify(data),
            },
        });
    }
    void triggerWorkflowsForEvent(workspaceId, "lead_created", lead.id, data);
    void dispatchWebhookEvent(workspaceId, "lead.created", { leadId: lead.id, email: lead.email });
    res.json({
        data: { synced: true, leadId: lead.id },
        meta: { timestamp: new Date().toISOString() },
        error: null,
    });
});
// POST /api/v1/sdk/form
sdkRouter.post("/form", requirePublicKey, async (req, res) => {
    const workspaceId = req.sdkWorkspaceId;
    const { formId, data } = formSchema.parse(req.body);
    void triggerWorkflowsForEvent(workspaceId, "form_submitted", null, { formId, data });
    void dispatchWebhookEvent(workspaceId, "form.submitted", { formId, data });
    res.json({
        data: { captured: true, formId },
        meta: { timestamp: new Date().toISOString() },
        error: null,
    });
});
