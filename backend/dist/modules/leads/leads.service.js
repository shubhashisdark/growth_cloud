import { randomUUID } from "node:crypto";
import { prisma } from "../../data/prisma.js";
const leadStageValues = ["subscriber", "lead", "mql", "sql", "customer"];
const leadStatusValues = ["active", "archived"];
function nowIso() {
    return new Date().toISOString();
}
function parseJson(value, fallback) {
    try {
        return JSON.parse(value || JSON.stringify(fallback));
    }
    catch {
        return fallback;
    }
}
function buildLeadWhere(query, workspaceId) {
    const search = query.q?.trim();
    return {
        workspaceId,
        ...(query.stage ? { lifecycleStage: query.stage } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(query.source ? { source: query.source } : {}),
        ...(search
            ? {
                OR: [
                    { email: { contains: search, mode: "insensitive" } },
                    { firstName: { contains: search, mode: "insensitive" } },
                    { lastName: { contains: search, mode: "insensitive" } },
                    { company: { contains: search, mode: "insensitive" } },
                ],
            }
            : {}),
    };
}
async function writeTimelineEvent(leadId, workspaceId, type, description, metadata = {}) {
    return prisma.leadActivity.create({
        data: {
            id: `act_${randomUUID().slice(0, 8)}`,
            leadId,
            workspaceId,
            activityType: type,
            description,
            metadataJson: JSON.stringify(metadata),
        },
    });
}
function mapLead(lead) {
    return {
        ...lead,
        customFields: parseJson(lead.customFieldsJson, {}),
        tags: parseJson(lead.tagsJson, []),
    };
}
export class LeadsService {
    async listLeads(query, workspaceId) {
        const sortBy = query.sortBy ?? "createdAt";
        const sortOrder = query.sortOrder ?? "desc";
        const page = query.page ?? 1;
        const limit = query.limit ?? 25;
        const where = buildLeadWhere(query, workspaceId);
        const total = await prisma.lead.count({ where });
        const leads = await prisma.lead.findMany({
            where,
            orderBy: { [sortBy]: sortOrder },
            skip: (page - 1) * limit,
            take: limit,
            include: { assignments: true },
        });
        return {
            status: 200,
            data: {
                items: leads.map(mapLead),
            },
            meta: {
                total,
                page,
                limit,
                hasNext: page * limit < total,
                timestamp: nowIso(),
            },
        };
    }
    async getLead(leadId, workspaceId) {
        const lead = await prisma.lead.findFirst({
            where: { id: leadId, workspaceId },
            include: {
                notes: { orderBy: { createdAt: "desc" } },
                activities: { orderBy: { createdAt: "desc" } },
                assignments: true,
                consents: true,
            },
        });
        if (!lead)
            return null;
        return {
            ...mapLead(lead),
            timeline: lead.activities.map((activity) => ({
                id: activity.id,
                type: activity.activityType,
                description: activity.description,
                createdAt: activity.createdAt,
                metadata: parseJson(activity.metadataJson, {}),
            })),
        };
    }
    async createLead(input, workspaceId) {
        const lead = await prisma.lead.create({
            data: {
                id: `lead_${randomUUID().slice(0, 8)}`,
                workspaceId,
                email: input.email,
                firstName: input.firstName,
                lastName: input.lastName ?? "",
                company: input.company ?? "",
                source: input.source ?? "Direct",
                status: input.status ?? "active",
                score: 0,
                lifecycleStage: input.lifecycleStage ?? "subscriber",
                tagsJson: JSON.stringify(input.tags ?? []),
                customFieldsJson: JSON.stringify(input.customFields ?? {}),
                assignedToId: input.assignedToId ?? null,
            },
        });
        await prisma.leadConsent.createMany({
            data: [
                {
                    id: `cons_${randomUUID().slice(0, 8)}`,
                    leadId: lead.id,
                    workspaceId,
                    type: "email",
                    granted: input.consentEmail ?? false,
                },
                {
                    id: `cons_${randomUUID().slice(0, 8)}`,
                    leadId: lead.id,
                    workspaceId,
                    type: "sms",
                    granted: input.consentSms ?? false,
                },
            ],
        });
        await writeTimelineEvent(lead.id, workspaceId, "lead.created", "Lead created", { email: lead.email });
        return mapLead(lead);
    }
    async updateLead(leadId, input, workspaceId) {
        const existing = await prisma.lead.findFirst({ where: { id: leadId, workspaceId } });
        if (!existing)
            return null;
        const updated = await prisma.lead.update({
            where: { id: existing.id },
            data: {
                ...(input.email !== undefined ? { email: input.email } : {}),
                ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
                ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
                ...(input.company !== undefined ? { company: input.company } : {}),
                ...(input.source !== undefined ? { source: input.source } : {}),
                ...(input.status !== undefined ? { status: input.status } : {}),
                ...(input.lifecycleStage !== undefined ? { lifecycleStage: input.lifecycleStage } : {}),
                ...(input.tags !== undefined ? { tagsJson: JSON.stringify(input.tags) } : {}),
                ...(input.customFields !== undefined ? { customFieldsJson: JSON.stringify(input.customFields) } : {}),
                ...(input.assignedToId !== undefined ? { assignedToId: input.assignedToId } : {}),
            },
        });
        await writeTimelineEvent(updated.id, workspaceId, "lead.updated", "Lead updated", {
            changes: Object.keys(input),
        });
        return mapLead(updated);
    }
    async deleteLead(leadId, workspaceId) {
        const existing = await prisma.lead.findFirst({ where: { id: leadId, workspaceId } });
        if (!existing)
            return null;
        const updated = await prisma.lead.update({
            where: { id: existing.id },
            data: { status: "archived" },
        });
        await writeTimelineEvent(existing.id, workspaceId, "lead.deleted", "Lead archived/deleted");
        return mapLead(updated);
    }
    async addNote(leadId, input, workspaceId) {
        const lead = await prisma.lead.findFirst({ where: { id: leadId, workspaceId } });
        if (!lead)
            return null;
        const note = await prisma.leadNote.create({
            data: {
                id: `note_${randomUUID().slice(0, 8)}`,
                leadId: lead.id,
                workspaceId: lead.workspaceId,
                note: input.note,
                author: input.author ?? "system",
            },
        });
        await writeTimelineEvent(lead.id, workspaceId, "note.created", "Note added", { noteId: note.id });
        return note;
    }
    async addTimelineEvent(leadId, input, workspaceId) {
        const lead = await prisma.lead.findFirst({ where: { id: leadId, workspaceId } });
        if (!lead)
            return null;
        return writeTimelineEvent(lead.id, workspaceId, "timeline.note", input.note, {
            author: input.author ?? "system",
        });
    }
    async updateConsent(leadId, input, workspaceId) {
        const lead = await prisma.lead.findFirst({ where: { id: leadId, workspaceId } });
        if (!lead)
            return null;
        const consent = await prisma.leadConsent.upsert({
            where: {
                leadId_type: { leadId: lead.id, type: input.type },
            },
            update: { granted: input.granted },
            create: {
                id: `cons_${randomUUID().slice(0, 8)}`,
                leadId: lead.id,
                workspaceId,
                type: input.type,
                granted: input.granted,
            },
        });
        await writeTimelineEvent(lead.id, workspaceId, "consent.updated", `Consent ${input.type} set to ${input.granted}`, {
            type: input.type,
            granted: input.granted,
        });
        return consent;
    }
    async bulkUpdate(input, workspaceId) {
        const leads = await prisma.lead.findMany({
            where: { id: { in: input.leadIds }, workspaceId },
        });
        const updatedCount = await prisma.$transaction(leads.map((lead) => {
            if (input.action === "archive")
                return prisma.lead.update({ where: { id: lead.id }, data: { status: "archived" } });
            if (input.action === "activate")
                return prisma.lead.update({ where: { id: lead.id }, data: { status: "active" } });
            return prisma.lead.update({
                where: { id: lead.id },
                data: { lifecycleStage: input.stage ?? lead.lifecycleStage },
            });
        }));
        return { updated: updatedCount.length };
    }
    async exportLeads(workspaceId) {
        const leads = await prisma.lead.findMany({
            where: { workspaceId },
            orderBy: { createdAt: "desc" },
        });
        const header = ["id", "email", "firstName", "lastName", "company", "source", "status", "score", "lifecycleStage", "tags", "customFields"].join(",");
        const rows = leads.map((lead) => [
            lead.id,
            lead.email,
            lead.firstName,
            lead.lastName,
            lead.company,
            lead.source,
            lead.status,
            lead.score,
            lead.lifecycleStage,
            parseJson(lead.tagsJson, []).join(";"),
            lead.customFieldsJson ?? "{}",
        ]
            .map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`)
            .join(","));
        return [header, ...rows].join("\n");
    }
    getTemplate() {
        return "email,firstName,lastName,company,source,lifecycleStage,tags\nexample@acme.com,Jane,Doe,Acme Inc,Organic,lead,crm;marketing\n";
    }
    async importLeads(body, workspaceId) {
        const lines = body.split(/\r?\n/).filter(Boolean);
        if (lines.length < 2)
            return { imported: 0, errors: ["No data rows found"] };
        const header = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
        const emailIdx = header.indexOf("email");
        const firstNameIdx = header.indexOf("firstName");
        const lastNameIdx = header.indexOf("lastName");
        const companyIdx = header.indexOf("company");
        const sourceIdx = header.indexOf("source");
        const stageIdx = header.indexOf("lifecycleStage");
        let count = 0;
        const errors = [];
        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
            const email = emailIdx >= 0 ? cols[emailIdx] : cols[0];
            if (!email || !email.includes("@")) {
                errors.push(`Row ${i}: invalid email "${email}"`);
                continue;
            }
            const existing = await prisma.lead.findFirst({ where: { email, workspaceId } });
            if (existing) {
                errors.push(`Row ${i}: email "${email}" already exists — skipped`);
                continue;
            }
            const firstName = firstNameIdx >= 0 ? cols[firstNameIdx] : email.split("@")[0];
            await prisma.lead.create({
                data: {
                    id: `lead_${randomUUID().slice(0, 8)}`,
                    workspaceId,
                    email,
                    firstName: firstName || email,
                    lastName: lastNameIdx >= 0 ? (cols[lastNameIdx] ?? "") : "",
                    company: companyIdx >= 0 ? (cols[companyIdx] ?? "") : "",
                    source: sourceIdx >= 0 ? (cols[sourceIdx] ?? "Import") : "Import",
                    status: "active",
                    score: 0,
                    lifecycleStage: (stageIdx >= 0 ? cols[stageIdx] : "subscriber"),
                },
            });
            count += 1;
        }
        return { imported: count, errors };
    }
}
