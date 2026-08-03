import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireWorkspaceMember } from "../../middleware/auth.middleware.js";
import { sendError, sendSuccess } from "../../lib/response.js";
import { LeadsService } from "./leads.service.js";
const leadsService = new LeadsService();
const leadStageValues = ["subscriber", "lead", "mql", "sql", "customer"];
const leadStatusValues = ["active", "archived"];
const leadListQuerySchema = z.object({
    q: z.string().optional(),
    stage: z.enum(leadStageValues).optional(),
    status: z.enum(leadStatusValues).optional(),
    source: z.string().optional(),
    sortBy: z.enum(["createdAt", "updatedAt", "score", "email"]).optional().default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(25)
});
const leadInputSchema = z.object({
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().optional().default(""),
    company: z.string().optional().default(""),
    source: z.string().min(1).default("Direct"),
    lifecycleStage: z.enum(leadStageValues).optional().default("subscriber"),
    tags: z.array(z.string().min(1)).optional().default([]),
    consentEmail: z.boolean().optional().default(false),
    consentSms: z.boolean().optional().default(false),
    customFields: z.record(z.string(), z.string()).optional().default({}),
    assignedToId: z.string().optional().nullable(),
    status: z.enum(leadStatusValues).optional().default("active")
});
const leadUpdateSchema = leadInputSchema.partial().extend({
    email: z.string().email().optional()
});
const noteInputSchema = z.object({
    note: z.string().min(1),
    author: z.string().optional()
});
const timelineEventSchema = z.object({
    note: z.string().min(1),
    author: z.string().optional()
});
const bulkActionSchema = z.object({
    leadIds: z.array(z.string().min(1)).min(1),
    action: z.enum(["archive", "activate", "advance_stage"]),
    stage: z.enum(leadStageValues).optional()
});
const consentUpdateSchema = z.object({
    type: z.enum(["email", "sms"]),
    granted: z.boolean()
});
export const leadsRouter = Router();
// --- Authenticated workspace-scoped routes ---
// CSV Export
leadsRouter.get("/export", requireAuth, requireWorkspaceMember(), async (request, response) => {
    const csv = await leadsService.exportLeads(request.workspace.workspaceId);
    response.setHeader("Content-Type", "text/csv; charset=utf-8");
    response.setHeader("Content-Disposition", 'attachment; filename="leads.csv"');
    response.send(csv);
});
// CSV Template
leadsRouter.get("/template", (_request, response) => {
    response.setHeader("Content-Type", "text/csv; charset=utf-8");
    response.send(leadsService.getTemplate());
});
// Bulk Actions (must be before /:leadId)
leadsRouter.post("/bulk", requireAuth, requireWorkspaceMember(), async (request, response) => {
    const payload = bulkActionSchema.parse(request.body);
    const result = await leadsService.bulkUpdate(payload, request.workspace.workspaceId);
    return sendSuccess(response, result);
});
// CSV Import
leadsRouter.post("/import", requireAuth, requireWorkspaceMember(), async (request, response) => {
    let body = "";
    if (typeof request.body === "string") {
        body = request.body;
    }
    else if (request.body && typeof request.body === "object") {
        body = typeof request.body.csvText === "string"
            ? request.body.csvText ?? ""
            : typeof request.body.body === "string"
                ? request.body.body ?? ""
                : "";
    }
    if (!body.trim()) {
        return sendError(response, "VALIDATION_ERROR", "CSV import requires raw text body", 400);
    }
    const result = await leadsService.importLeads(body, request.workspace.workspaceId);
    return sendSuccess(response, result, { imported: result.imported });
});
// Timeline for a lead
leadsRouter.get("/timeline/:leadId", requireAuth, requireWorkspaceMember(), async (request, response) => {
    const leadId = request.params.leadId;
    const detail = await leadsService.getLead(leadId, request.workspace.workspaceId);
    if (!detail)
        return sendError(response, "NOT_FOUND", "Lead not found", 404);
    return sendSuccess(response, { leadId: detail.id, timeline: detail.timeline });
});
// List Leads
leadsRouter.get("/", requireAuth, requireWorkspaceMember(), async (request, response) => {
    const query = leadListQuerySchema.parse(request.query);
    const result = await leadsService.listLeads(query, request.workspace.workspaceId);
    return response.json({ ...result, error: null });
});
// Get single Lead
leadsRouter.get("/:leadId", requireAuth, requireWorkspaceMember(), async (request, response) => {
    const leadId = request.params.leadId;
    const detail = await leadsService.getLead(leadId, request.workspace.workspaceId);
    if (!detail)
        return sendError(response, "NOT_FOUND", "Lead not found", 404);
    return sendSuccess(response, detail);
});
// Create Lead
leadsRouter.post("/", requireAuth, requireWorkspaceMember(["super_admin", "admin", "marketer", "developer", "sales"]), async (request, response) => {
    const payload = leadInputSchema.parse(request.body);
    const lead = await leadsService.createLead(payload, request.workspace.workspaceId);
    return response.status(201).json({ data: lead, meta: { timestamp: new Date().toISOString() }, error: null });
});
// Update Lead (full or partial)
leadsRouter.patch("/:leadId", requireAuth, requireWorkspaceMember(["super_admin", "admin", "marketer", "developer", "sales"]), async (request, response) => {
    const leadId = request.params.leadId;
    const payload = leadUpdateSchema.parse(request.body);
    const updated = await leadsService.updateLead(leadId, payload, request.workspace.workspaceId);
    if (!updated)
        return sendError(response, "NOT_FOUND", "Lead not found", 404);
    return sendSuccess(response, updated);
});
// Legacy PUT update support
leadsRouter.put("/:leadId", requireAuth, requireWorkspaceMember(["super_admin", "admin", "marketer", "developer", "sales"]), async (request, response) => {
    const leadId = request.params.leadId;
    const payload = leadUpdateSchema.parse(request.body);
    const updated = await leadsService.updateLead(leadId, payload, request.workspace.workspaceId);
    if (!updated)
        return sendError(response, "NOT_FOUND", "Lead not found", 404);
    return sendSuccess(response, updated);
});
// Delete Lead (soft delete → archive)
leadsRouter.delete("/:leadId", requireAuth, requireWorkspaceMember(["super_admin", "admin"]), async (request, response) => {
    const leadId = request.params.leadId;
    const result = await leadsService.deleteLead(leadId, request.workspace.workspaceId);
    if (!result)
        return sendError(response, "NOT_FOUND", "Lead not found", 404);
    return sendSuccess(response, result);
});
// Add Note
leadsRouter.post("/:leadId/notes", requireAuth, requireWorkspaceMember(["super_admin", "admin", "marketer", "developer", "sales"]), async (request, response) => {
    const leadId = request.params.leadId;
    const payload = noteInputSchema.parse(request.body);
    const actorId = request.actor.userId;
    const note = await leadsService.addNote(leadId, {
        note: payload.note,
        author: payload.author ?? actorId
    }, request.workspace.workspaceId);
    if (!note)
        return sendError(response, "NOT_FOUND", "Lead not found", 404);
    return response.status(201).json({ data: note, meta: { timestamp: new Date().toISOString() }, error: null });
});
// Add Timeline Event
leadsRouter.post("/:leadId/timeline", requireAuth, requireWorkspaceMember(), async (request, response) => {
    const leadId = request.params.leadId;
    const payload = timelineEventSchema.parse(request.body);
    const actorId = request.actor.userId;
    const activity = await leadsService.addTimelineEvent(leadId, {
        note: payload.note,
        author: payload.author ?? actorId
    }, request.workspace.workspaceId);
    if (!activity)
        return sendError(response, "NOT_FOUND", "Lead not found", 404);
    return response.status(201).json({ data: activity, meta: { timestamp: new Date().toISOString() }, error: null });
});
// Update Consent
leadsRouter.patch("/:leadId/consents", requireAuth, requireWorkspaceMember(["super_admin", "admin", "marketer"]), async (request, response) => {
    const leadId = request.params.leadId;
    const payload = consentUpdateSchema.parse(request.body);
    const result = await leadsService.updateConsent(leadId, payload, request.workspace.workspaceId);
    if (!result)
        return sendError(response, "NOT_FOUND", "Lead not found", 404);
    return sendSuccess(response, result);
});
// Add Tag to Lead
leadsRouter.post("/:leadId/tags", requireAuth, requireWorkspaceMember(["super_admin", "admin", "marketer", "developer", "sales"]), async (request, response) => {
    const leadId = request.params.leadId;
    const workspaceId = request.workspace.workspaceId;
    const { tag } = z.object({ tag: z.string().min(1) }).parse(request.body);
    // Ensure the lead exists
    const lead = await (await import("../../data/prisma.js")).prisma.lead.findFirst({ where: { id: leadId, workspaceId } });
    if (!lead)
        return sendError(response, "NOT_FOUND", "Lead not found", 404);
    // Upsert tag at workspace level
    const { randomUUID: uuid } = await import("node:crypto");
    const tagRecord = await (await import("../../data/prisma.js")).prisma.leadTag.upsert({
        where: { workspaceId_name: { workspaceId, name: tag } },
        create: { id: `tag_${uuid().replace(/-/g, "").slice(0, 8)}`, workspaceId, name: tag },
        update: {},
    });
    // Add tag to lead's tagsJson array
    const currentTags = JSON.parse(lead.tagsJson ?? "[]");
    if (!currentTags.includes(tag)) {
        await (await import("../../data/prisma.js")).prisma.lead.update({
            where: { id: leadId },
            data: { tagsJson: JSON.stringify([...currentTags, tag]) },
        });
    }
    return response.status(201).json({ data: { tag: tagRecord, leadId }, meta: { timestamp: new Date().toISOString() }, error: null });
});
// Get Lead Activity / Timeline
leadsRouter.get("/:leadId/activity", requireAuth, requireWorkspaceMember(), async (request, response) => {
    const leadId = request.params.leadId;
    const detail = await leadsService.getLead(leadId, request.workspace.workspaceId);
    if (!detail)
        return sendError(response, "NOT_FOUND", "Lead not found", 404);
    return sendSuccess(response, { leadId: detail.id, activities: detail.timeline });
});
