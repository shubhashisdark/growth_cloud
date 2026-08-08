import { randomUUID } from "node:crypto";
import { prisma } from "../../data/prisma.js";
import { evaluateCondition, type WorkflowDefinition, type WorkflowStep } from "./workflow.executor.js";
import { buildLeadEmailVariables, renderEmailTemplate, sendEmailWithFallback } from "../email/email.service.js";

const MAX_RETRIES = 3;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function executeAction(
  step: WorkflowStep,
  lead: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    company: string;
    workspaceId: string;
    score: number;
    lifecycleStage: string;
    status: string;
    source?: string;
    tagsJson: string;
    customFieldsJson?: string;
  },
  runId: string
): Promise<{ success: boolean; output: Record<string, unknown>; error?: string }> {
  const config = step.config ?? {};

  switch (step.actionType) {
    case "send_email": {
      const variables = buildLeadEmailVariables(lead);
      const rawSubject = String(config.subject || "Hello from Growth Cloud");
      const rawBody = String(config.body || "Hi {{firstName}},");
      const rendered = renderEmailTemplate(
        {
          subject: rawSubject,
          html: rawBody.replace(/\n/g, "<br/>"),
          text: rawBody,
        },
        variables
      );
      await sendEmailWithFallback({
        to: lead.email,
        subject: rendered.subject,
        html: `<p>${rendered.html}</p>`,
        text: rendered.text,
      });
      return {
        success: true,
        output: { emailSentTo: lead.email, subject: rendered.subject, body: rendered.text },
      };
    }

    case "update_score": {
      const delta = Number(config.delta ?? 0);
      const newScore = Math.max(0, Math.min(100, lead.score + delta));
      await prisma.lead.update({
        where: { id: lead.id },
        data: { score: newScore, scoreUpdatedAt: new Date() },
      });
      await prisma.scoreHistory.create({
        data: {
          id: `sh_${randomUUID().slice(0, 8)}`,
          leadId: lead.id,
          scoreBefore: lead.score,
          scoreAfter: newScore,
          delta,
          reason: `Workflow action (run: ${runId})`,
        },
      });
      return { success: true, output: { scoreBefore: lead.score, scoreAfter: newScore, delta } };
    }

    case "add_tag": {
      const tag = String(config.tag ?? "");
      if (!tag) return { success: false, output: {}, error: "No tag specified" };
      const tags = JSON.parse(lead.tagsJson) as string[];
      if (!tags.includes(tag)) {
        tags.push(tag);
        await prisma.lead.update({ where: { id: lead.id }, data: { tagsJson: JSON.stringify(tags) } });
      }
      return { success: true, output: { tag, tags } };
    }

    case "change_status": {
      const newStatus = String(config.lifecycleStage ?? lead.lifecycleStage);
      await prisma.lead.update({ where: { id: lead.id }, data: { lifecycleStage: newStatus as any } });
      return { success: true, output: { previousStage: lead.lifecycleStage, newStage: newStatus } };
    }

    case "notify_sales": {
      const message = String(config.message ?? `Lead ${lead.firstName} ${lead.lastName} needs attention.`);
      // In production this would push to a CRM/Slack/etc
      await prisma.leadActivity.create({
        data: {
          id: `la_${randomUUID().slice(0, 8)}`,
          leadId: lead.id,
          workspaceId: lead.workspaceId,
          activityType: "sales_notification",
          description: message,
          metadataJson: JSON.stringify({ runId, config }),
        },
      });
      return { success: true, output: { notified: true, message } };
    }

    case "fire_webhook": {
      const url = String(config.url ?? "");
      if (!url) return { success: false, output: {}, error: "No webhook URL specified" };
      const payload = { lead: { id: lead.id, email: lead.email, score: lead.score }, runId };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });
      return {
        success: res.ok,
        output: { statusCode: res.status, url },
        error: res.ok ? undefined : `Webhook returned ${res.status}`,
      };
    }

    default:
      return { success: false, output: {}, error: `Unknown action type: ${step.actionType}` };
  }
}

export async function executeWorkflow(workflowId: string, leadId: string | null, triggerEvent: string, input: Record<string, unknown> = {}) {
  const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } });
  if (!workflow || workflow.status !== "active") return null;

  const definition = JSON.parse(workflow.definitionJson) as WorkflowDefinition;
  const steps = definition.steps ?? [];

  const run = await prisma.workflowRun.create({
    data: {
      id: `wr_${randomUUID().slice(0, 10)}`,
      workflowId,
      leadId,
      status: "running",
      triggerEvent,
      inputJson: JSON.stringify(input),
    },
  });

  let lead = leadId ? await prisma.lead.findUnique({ where: { id: leadId } }) : null;

  try {
    for (const step of steps) {
      const stepStart = Date.now();

      // Reload lead if mutated
      if (leadId) lead = await prisma.lead.findUnique({ where: { id: leadId } });

      // Evaluate condition step
      if (step.type === "condition") {
        if (!lead) continue;
        const pass = evaluateCondition(lead as any, step);
        await prisma.workflowStepLog.create({
          data: {
            id: `wsl_${randomUUID().slice(0, 8)}`,
            runId: run.id,
            stepIndex: step.index,
            stepType: "condition",
            status: "completed",
            inputJson: JSON.stringify({ field: step.conditionField, operator: step.conditionOperator, value: step.conditionValue }),
            outputJson: JSON.stringify({ pass }),
            durationMs: Date.now() - stepStart,
          },
        });
        if (!pass) break; // Condition failed — stop workflow
        continue;
      }

      // Delay step
      if (step.type === "delay") {
        const delayMs = (step.delayMinutes ?? 0) * 60 * 1000;
        // For testing we skip long delays; in production BullMQ handles actual delays
        if (delayMs > 0 && delayMs <= 5000) await sleep(delayMs);
        await prisma.workflowStepLog.create({
          data: {
            id: `wsl_${randomUUID().slice(0, 8)}`,
            runId: run.id,
            stepIndex: step.index,
            stepType: "delay",
            status: "completed",
            inputJson: JSON.stringify({ delayMinutes: step.delayMinutes }),
            outputJson: JSON.stringify({ skippedInDev: delayMs > 5000 }),
            durationMs: Date.now() - stepStart,
          },
        });
        continue;
      }

      // Action step with retry
      if (step.type === "action" && lead) {
        let attempt = 0;
        let lastError = "";
        let result: { success: boolean; output: Record<string, unknown>; error?: string } | null = null;

        while (attempt < MAX_RETRIES) {
          try {
            result = await executeAction(step, lead as any, run.id);
            if (result.success) break;
            lastError = result.error ?? "Unknown error";
          } catch (err) {
            lastError = err instanceof Error ? err.message : "Unknown error";
          }
          attempt++;
          if (attempt < MAX_RETRIES) await sleep(Math.pow(2, attempt) * 500); // exponential backoff
        }

        await prisma.workflowStepLog.create({
          data: {
            id: `wsl_${randomUUID().slice(0, 8)}`,
            runId: run.id,
            stepIndex: step.index,
            stepType: `action:${step.actionType}`,
            status: result?.success ? "completed" : "failed",
            inputJson: JSON.stringify(step.config ?? {}),
            outputJson: JSON.stringify(result?.output ?? {}),
            errorMessage: result?.success ? null : lastError,
            durationMs: Date.now() - stepStart,
          },
        });

        if (!result?.success) {
          throw new Error(`Action ${step.actionType} failed after ${MAX_RETRIES} retries: ${lastError}`);
        }
      }
    }

    await prisma.workflowRun.update({
      where: { id: run.id },
      data: { status: "completed", finishedAt: new Date() },
    });
    await prisma.workflow.update({
      where: { id: workflowId },
      data: { runCount: { increment: 1 }, lastRunAt: new Date() },
    });

    return { runId: run.id, status: "completed" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Workflow execution failed";
    await prisma.workflowRun.update({
      where: { id: run.id },
      data: { status: "failed", finishedAt: new Date(), errorMessage: message },
    });
    await prisma.workflow.update({
      where: { id: workflowId },
      data: { errorCount: { increment: 1 }, lastRunAt: new Date() },
    });
    return { runId: run.id, status: "failed", error: message };
  }
}
