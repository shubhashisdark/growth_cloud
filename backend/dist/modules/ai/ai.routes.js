import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../data/prisma.js";
import { requireAuth, requireWorkspaceMember } from "../../middleware/auth.middleware.js";
import { sendSuccess } from "../../lib/response.js";
import { getAnalyticsOverview } from "../analytics/analytics.service.js";
import { generateAiScoringHints } from "../scoring/scoring.service.js";
const aiRouter = Router();
const promptTypeValues = ["email-generator", "lead-summary", "lead-scoring", "campaign-insights", "segment-builder"];
const runRequestSchema = z.object({
    type: z.enum(promptTypeValues),
    input: z.record(z.string(), z.unknown()).default({}),
    stream: z.boolean().optional().default(false),
    retries: z.number().int().min(0).max(3).optional().default(1)
});
const leadSummarySchema = z.object({
    leadId: z.string().min(1)
});
const emailGeneratorSchema = z.object({
    subject: z.string().optional(),
    audience: z.string().optional(),
    goal: z.string().optional(),
    tone: z.string().optional(),
    context: z.string().optional()
});
const scoringSchema = z.object({
    leadId: z.string().min(1).optional(),
    notes: z.string().optional()
});
const campaignInsightsSchema = z.object({
    range: z.enum(["7d", "30d", "90d", "12m", "all"]).optional().default("30d")
});
const segmentBuilderSchema = z.object({
    objective: z.string().optional(),
    attributes: z.array(z.string()).optional(),
    source: z.string().optional()
});
function buildPrompt(type, input) {
    switch (type) {
        case "email-generator": {
            const payload = emailGeneratorSchema.parse(input);
            return {
                title: "AI Email Generator",
                prompt: [
                    `Generate a marketing email with the following constraints:`,
                    `Goal: ${payload.goal ?? "Increase engagement and conversions"}`,
                    `Audience: ${payload.audience ?? "B2B marketing audience"}`,
                    `Tone: ${payload.tone ?? "clear, concise, persuasive"}`,
                    `Subject: ${payload.subject ?? "Create a high-performing subject line"}`,
                    payload.context ? `Context: ${payload.context}` : "",
                    `Return: subject, preview text, body copy, CTA, and 3 variations.`
                ].filter(Boolean).join("\n")
            };
        }
        case "lead-summary": {
            const payload = leadSummarySchema.parse(input);
            return {
                title: "AI Lead Summary",
                prompt: `Summarize the lead ${payload.leadId} using profile, activities, score, and lifecycle context. Return a concise executive summary, buying signals, objections, and recommended next action.`
            };
        }
        case "lead-scoring": {
            const payload = scoringSchema.parse(input);
            return {
                title: "AI Lead Scoring",
                prompt: `Assess the lead scoring strategy${payload.leadId ? ` for lead ${payload.leadId}` : ""}. Use engagement, lifecycle stage, source, and historical actions. Return score rationale, score band, and suggested positive and negative signals.`
            };
        }
        case "campaign-insights": {
            const payload = campaignInsightsSchema.parse(input);
            return {
                title: "AI Campaign Insights",
                prompt: `Analyze campaign performance for the last ${payload.range}. Return performance summary, anomalies, and optimization recommendations across open rate, click rate, conversion, and deliverability.`
            };
        }
        case "segment-builder": {
            const payload = segmentBuilderSchema.parse(input);
            return {
                title: "AI Segment Builder",
                prompt: [
                    `Build an audience segment strategy.`,
                    payload.objective ? `Objective: ${payload.objective}` : "Objective: identify high-intent leads",
                    payload.source ? `Primary source: ${payload.source}` : "",
                    payload.attributes?.length ? `Attributes: ${payload.attributes.join(", ")}` : "Attributes: engagement, lifecycle stage, score, source",
                    `Return: segment name, inclusion rules, exclusion rules, and activation workflow suggestions.`
                ].filter(Boolean).join("\n")
            };
        }
    }
}
async function createPromptLog(workspaceId, type, prompt, status, output, attempts) {
    return prisma.auditLog.create({
        data: {
            id: `ai_${randomUUID().slice(0, 12)}`,
            workspaceId,
            actorId: null,
            action: `ai.${type}`,
            entityType: "ai_prompt",
            entityId: `run_${randomUUID().slice(0, 8)}`,
            metadataJson: JSON.stringify({ type, prompt, status, output, attempts }),
        }
    });
}
async function runAiPrompt(workspaceId, type, input, stream, retries) {
    const { title, prompt } = buildPrompt(type, input);
    const attempts = Math.max(1, retries + 1);
    let output = "";
    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey) {
        try {
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        {
                            role: "system",
                            content: `You are an AI assistant in a Marketing Automation platform. Your task is: ${title}. Keep your output concise, professional, and well-structured.`
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.7
                })
            });
            if (!response.ok) {
                throw new Error(`Groq API error: ${response.status} ${response.statusText} - ${await response.text()}`);
            }
            const data = (await response.json());
            output = data.choices?.[0]?.message?.content ?? "";
        }
        catch (error) {
            console.error("Failed to fetch from Groq API, falling back to mock:", error);
            output = `${title}\n\n${prompt}\n\nResult: Generated structured AI draft for ${type}. (Failed to contact Groq API)`;
        }
    }
    else {
        output = `${title}\n\n${prompt}\n\nResult: Generated structured AI draft for ${type}.`;
    }
    await createPromptLog(workspaceId, type, prompt, "completed", output, attempts);
    return {
        type,
        title,
        attempts,
        stream,
        output,
        tokens: {
            prompt: prompt.length,
            completion: output.length
        }
    };
}
function parseAiInput(type, input) {
    switch (type) {
        case "email-generator":
            return emailGeneratorSchema.parse(input);
        case "lead-summary":
            return leadSummarySchema.parse(input);
        case "lead-scoring":
            return scoringSchema.parse(input);
        case "campaign-insights":
            return campaignInsightsSchema.parse(input);
        case "segment-builder":
            return segmentBuilderSchema.parse(input);
    }
}
aiRouter.get("/templates", requireAuth, requireWorkspaceMember(), async (_request, response) => {
    return sendSuccess(response, {
        items: [
            {
                type: "email-generator",
                title: "AI Email Generator",
                description: "Generate email copy, subject lines, and CTAs",
            },
            {
                type: "lead-summary",
                title: "AI Lead Summary",
                description: "Summarize a lead using profile and activity history",
            },
            {
                type: "lead-scoring",
                title: "AI Lead Scoring",
                description: "Recommend scoring signals and bands",
            },
            {
                type: "campaign-insights",
                title: "AI Campaign Insights",
                description: "Analyze campaign performance and recommendations",
            },
            {
                type: "segment-builder",
                title: "AI Segment Builder",
                description: "Generate audience rules and activation suggestions",
            },
        ]
    });
});
aiRouter.post("/run", requireAuth, requireWorkspaceMember(), async (request, response) => {
    const payload = runRequestSchema.parse(request.body);
    const parsedInput = parseAiInput(payload.type, payload.input);
    const result = await runAiPrompt(request.workspace.workspaceId, payload.type, parsedInput, payload.stream, payload.retries);
    return response.status(202).json({ data: result, meta: { timestamp: new Date().toISOString() }, error: null });
});
aiRouter.post("/email-generator", requireAuth, requireWorkspaceMember(), async (request, response) => {
    const result = await runAiPrompt(request.workspace.workspaceId, "email-generator", emailGeneratorSchema.parse(request.body ?? {}), false, 1);
    return response.status(202).json({ data: result, meta: { timestamp: new Date().toISOString() }, error: null });
});
aiRouter.post("/lead-summary", requireAuth, requireWorkspaceMember(), async (request, response) => {
    const result = await runAiPrompt(request.workspace.workspaceId, "lead-summary", leadSummarySchema.parse(request.body ?? {}), false, 1);
    return response.status(202).json({ data: result, meta: { timestamp: new Date().toISOString() }, error: null });
});
aiRouter.post("/lead-scoring", requireAuth, requireWorkspaceMember(), async (request, response) => {
    const result = await runAiPrompt(request.workspace.workspaceId, "lead-scoring", scoringSchema.parse(request.body ?? {}), false, 1);
    return response.status(202).json({ data: result, meta: { timestamp: new Date().toISOString() }, error: null });
});
aiRouter.post("/campaign-insights", requireAuth, requireWorkspaceMember(), async (request, response) => {
    const payload = campaignInsightsSchema.parse(request.body ?? {});
    const analytics = await getAnalyticsOverview(request.workspace.workspaceId, payload.range);
    const result = await runAiPrompt(request.workspace.workspaceId, "campaign-insights", { ...payload, analytics }, false, 1);
    return response.status(202).json({ data: result, meta: { timestamp: new Date().toISOString() }, error: null });
});
aiRouter.post("/segment-builder", requireAuth, requireWorkspaceMember(), async (request, response) => {
    const result = await runAiPrompt(request.workspace.workspaceId, "segment-builder", segmentBuilderSchema.parse(request.body ?? {}), false, 1);
    return response.status(202).json({ data: result, meta: { timestamp: new Date().toISOString() }, error: null });
});
aiRouter.get("/scoring-hints", requireAuth, requireWorkspaceMember(), async (_request, response) => {
    return sendSuccess(response, { items: generateAiScoringHints() });
});
aiRouter.get("/prompt-logs", requireAuth, requireWorkspaceMember(), async (request, response) => {
    const logs = await prisma.auditLog.findMany({
        where: {
            workspaceId: request.workspace.workspaceId,
            entityType: "ai_prompt"
        },
        orderBy: { createdAt: "desc" },
        take: 25
    });
    return sendSuccess(response, {
        items: logs.map((log) => ({
            id: log.id,
            action: log.action,
            entityId: log.entityId,
            metadata: JSON.parse(log.metadataJson ?? "{}"),
            createdAt: log.createdAt
        }))
    });
});
aiRouter.post("/stream", requireAuth, requireWorkspaceMember(), async (request, response) => {
    const payload = runRequestSchema.parse(request.body);
    const result = await runAiPrompt(request.workspace.workspaceId, payload.type, payload.input, true, payload.retries);
    response.setHeader("Content-Type", "text/event-stream");
    response.setHeader("Cache-Control", "no-cache");
    response.setHeader("Connection", "keep-alive");
    response.write(`event: message\ndata: ${JSON.stringify({ chunk: result.output.slice(0, 120), done: false })}\n\n`);
    response.write(`event: message\ndata: ${JSON.stringify({ chunk: result.output.slice(120), done: true })}\n\n`);
    response.end();
});
export { aiRouter };
