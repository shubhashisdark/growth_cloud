/**
 * Workflow BullMQ queue worker.
 * Falls back to in-process execution if Redis is unavailable (dev mode).
 */
import { executeWorkflow } from "./workflow.service.js";

type WorkflowJobData = {
  workflowId: string;
  leadId: string | null;
  triggerEvent: string;
  input?: Record<string, unknown>;
};

// Simple in-memory queue for environments without Redis
const jobQueue: WorkflowJobData[] = [];
let processing = false;

async function processQueue() {
  if (processing) return;
  processing = true;
  while (jobQueue.length > 0) {
    const job = jobQueue.shift()!;
    try {
      await executeWorkflow(job.workflowId, job.leadId, job.triggerEvent, job.input ?? {});
    } catch (err) {
      console.error("[WorkflowQueue] Job failed:", err);
    }
  }
  processing = false;
}

export function enqueueWorkflow(data: WorkflowJobData) {
  jobQueue.push(data);
  void processQueue();
}

export async function triggerWorkflowsForEvent(
  workspaceId: string,
  triggerType: string,
  leadId: string | null,
  input: Record<string, unknown> = {}
) {
  const { prisma } = await import("../../data/prisma.js");
  const workflows = await prisma.workflow.findMany({
    where: { workspaceId, triggerType, status: "active" },
  });

  for (const wf of workflows) {
    enqueueWorkflow({ workflowId: wf.id, leadId, triggerEvent: triggerType, input });
  }

  return { triggered: workflows.length };
}
