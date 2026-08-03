import { EventEmitter } from "node:events";
import { sendEmailWithFallback, type EmailMessage } from "./email.service.js";
import { prisma } from "../../data/prisma.js";

export interface SendEmailJobData {
  jobId: string;
  campaignId?: string;
  workspaceId: string;
  to: string;
  recipientName?: string;
  subject: string;
  html: string;
  text: string;
}

class InMemoryEmailQueue extends EventEmitter {
  private queue: SendEmailJobData[] = [];
  private processing = false;

  async add(data: SendEmailJobData) {
    this.queue.push(data);
    this.processNext();
  }

  async addBulk(jobs: SendEmailJobData[]) {
    this.queue.push(...jobs);
    this.processNext();
  }

  private async processNext() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) break;

      try {
        // Check suppression list first
        const suppressed = await prisma.emailSuppression.findFirst({
          where: { workspaceId: job.workspaceId, email: job.to },
        });

        if (suppressed) {
          if (job.jobId) {
            await prisma.emailJob.updateMany({
              where: { id: job.jobId },
              data: { status: "suppressed" },
            }).catch(() => null);
          }
          continue;
        }

        const receipt = await sendEmailWithFallback({
          to: job.to,
          subject: job.subject,
          html: job.html,
          text: job.text,
        });

        // Update Job Record in Database
        if (job.jobId) {
          await prisma.emailJob.updateMany({
            where: { id: job.jobId },
            data: {
              status: "sent",
              messageId: receipt.messageId,
              attemptedProviders: JSON.stringify(receipt.attemptedProviders),
              sentAt: new Date(),
            },
          }).catch(() => null);
        }

        // Increment Campaign sent count
        if (job.campaignId) {
          await prisma.emailCampaign.updateMany({
            where: { id: job.campaignId },
            data: { sentCount: { increment: 1 } },
          }).catch(() => null);
        }
      } catch (err) {
        if (job.jobId) {
          await prisma.emailJob.updateMany({
            where: { id: job.jobId },
            data: { status: "failed" },
          }).catch(() => null);
        }
      }
    }

    this.processing = false;
  }
}

export const emailQueue = new InMemoryEmailQueue();
