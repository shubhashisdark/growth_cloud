import { randomUUID } from "node:crypto";
import { prisma } from "../../data/prisma.js";
import { renderEmailTemplate, buildTrackingUrls } from "./email.service.js";
import { emailQueue, type SendEmailJobData } from "./email.queue.js";

function nowIso() {
  return new Date().toISOString();
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  try {
    return JSON.parse(value || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

export type CreateTemplateInput = {
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables?: string[];
};

export type CreateCampaignInput = {
  name: string;
  subject: string;
  fromName?: string;
  fromEmail?: string;
  templateId?: string;
  scheduledAt?: string;
};

export type SingleSendInput = {
  to: string;
  recipientName?: string;
  subject: string;
  html: string;
  text?: string;
  variables?: Record<string, string>;
};

export class EmailCampaignsService {
  private baseUrl: string;

  constructor(baseUrl = "http://localhost:4000") {
    this.baseUrl = baseUrl;
  }

  // ─────────────────────────────────────────────
  // TEMPLATES
  // ─────────────────────────────────────────────

  async listTemplates(workspaceId: string) {
    const templates = await prisma.emailTemplate.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });
    return templates.map((t) => ({
      ...t,
      variables: parseJson<string[]>(t.variablesJson, []),
    }));
  }

  async createTemplate(input: CreateTemplateInput, workspaceId: string) {
    const template = await prisma.emailTemplate.create({
      data: {
        id: `tpl_${randomUUID().slice(0, 8)}`,
        workspaceId,
        name: input.name,
        subject: input.subject,
        htmlContent: input.htmlContent,
        textContent: input.textContent || input.htmlContent.replace(/<[^>]+>/g, ""),
        variablesJson: JSON.stringify(input.variables || []),
      },
    });

    return {
      ...template,
      variables: parseJson<string[]>(template.variablesJson, []),
    };
  }

  async updateTemplate(templateId: string, input: Partial<CreateTemplateInput>, workspaceId: string) {
    const existing = await prisma.emailTemplate.findFirst({ where: { id: templateId, workspaceId } });
    if (!existing) return null;

    const updated = await prisma.emailTemplate.update({
      where: { id: existing.id },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.subject ? { subject: input.subject } : {}),
        ...(input.htmlContent ? { htmlContent: input.htmlContent } : {}),
        ...(input.textContent ? { textContent: input.textContent } : {}),
        ...(input.variables ? { variablesJson: JSON.stringify(input.variables) } : {}),
      },
    });

    return {
      ...updated,
      variables: parseJson<string[]>(updated.variablesJson, []),
    };
  }

  async deleteTemplate(templateId: string, workspaceId: string) {
    const existing = await prisma.emailTemplate.findFirst({ where: { id: templateId, workspaceId } });
    if (!existing) return null;

    await prisma.emailTemplate.delete({ where: { id: existing.id } });
    return { success: true };
  }

  // ─────────────────────────────────────────────
  // CAMPAIGNS
  // ─────────────────────────────────────────────

  async listCampaigns(workspaceId: string) {
    return prisma.emailCampaign.findMany({
      where: { workspaceId },
      include: { template: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getCampaign(campaignId: string, workspaceId: string) {
    const campaign = await prisma.emailCampaign.findFirst({
      where: { id: campaignId, workspaceId },
      include: {
        template: true,
        jobs: { orderBy: { createdAt: "desc" }, take: 50 },
        events: { orderBy: { createdAt: "desc" }, take: 50 },
      },
    });
    return campaign;
  }

  async createCampaign(input: CreateCampaignInput, workspaceId: string) {
    return prisma.emailCampaign.create({
      data: {
        id: `cmp_${randomUUID().slice(0, 8)}`,
        workspaceId,
        name: input.name,
        subject: input.subject,
        fromName: input.fromName || "Growth Cloud",
        fromEmail: input.fromEmail || null,
        templateId: input.templateId || null,
        status: input.scheduledAt ? "scheduled" : "draft",
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      },
    });
  }

  async updateCampaign(campaignId: string, input: Partial<CreateCampaignInput>, workspaceId: string) {
    const existing = await prisma.emailCampaign.findFirst({ where: { id: campaignId, workspaceId } });
    if (!existing) return null;

    return prisma.emailCampaign.update({
      where: { id: existing.id },
      data: {
        ...(input.name ? { name: input.name } : {}),
        ...(input.subject ? { subject: input.subject } : {}),
        ...(input.fromName ? { fromName: input.fromName } : {}),
        ...(input.fromEmail ? { fromEmail: input.fromEmail } : {}),
        ...(input.templateId !== undefined ? { templateId: input.templateId } : {}),
        ...(input.scheduledAt !== undefined
          ? {
              scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
              status: input.scheduledAt ? "scheduled" : existing.status,
            }
          : {}),
      },
    });
  }

  async deleteCampaign(campaignId: string, workspaceId: string) {
    const existing = await prisma.emailCampaign.findFirst({ where: { id: campaignId, workspaceId } });
    if (!existing) return null;

    await prisma.$transaction([
      prisma.emailEvent.deleteMany({ where: { campaignId: existing.id } }),
      prisma.emailJob.deleteMany({ where: { campaignId: existing.id } }),
      prisma.emailCampaign.delete({ where: { id: existing.id } }),
    ]);

    return { success: true };
  }

  // ─────────────────────────────────────────────
  // DISPATCH & BULK SEND
  // ─────────────────────────────────────────────

  async sendCampaign(campaignId: string, workspaceId: string) {
    const campaign = await prisma.emailCampaign.findFirst({
      where: { id: campaignId, workspaceId },
      include: { template: true },
    });
    if (!campaign) return null;

    // Fetch active leads in workspace
    const leads = await prisma.lead.findMany({
      where: { workspaceId, status: "active" },
    });

    if (leads.length === 0) {
      await prisma.emailCampaign.update({
        where: { id: campaign.id },
        data: { status: "sent", sentAt: new Date(), totalRecipients: 0 },
      });
      return { campaign, dispatchedCount: 0 };
    }

    // Update campaign status to sending
    await prisma.emailCampaign.update({
      where: { id: campaign.id },
      data: { status: "sending", totalRecipients: leads.length },
    });

    const jobsToCreate: Array<{
      id: string;
      campaignId: string;
      recipientEmail: string;
      recipientName: string;
      status: string;
    }> = [];

    const queueJobs: SendEmailJobData[] = [];

    for (const lead of leads) {
      const jobId = `job_${randomUUID().slice(0, 8)}`;
      const variables: Record<string, string> = {
        firstName: lead.firstName || "Friend",
        lastName: lead.lastName || "",
        email: lead.email,
        company: lead.company || "",
        source: lead.source || "",
      };

      const rawHtml = campaign.template?.htmlContent || `<p>${campaign.subject}</p>`;
      const rawText = campaign.template?.textContent || campaign.subject;

      const rendered = renderEmailTemplate(
        { subject: campaign.subject, html: rawHtml, text: rawText },
        variables,
      );

      // Inject open tracking pixel and click wrapper
      const tracking = buildTrackingUrls({
        baseUrl: this.baseUrl,
        campaignId: campaign.id,
        messageId: jobId,
        recipientId: lead.id,
      });

      const openPixelHtml = `<img src="${tracking.openPixelUrl}" alt="" width="1" height="1" style="display:none;" />`;
      const unsubscribeUrl = `${this.baseUrl}/api/v1/email/tracking/unsubscribe?email=${encodeURIComponent(lead.email)}&workspaceId=${workspaceId}`;
      const footerHtml = `<br/><hr/><p style="font-size:12px;color:#666;">Prefer not to receive these emails? <a href="${unsubscribeUrl}">Unsubscribe here</a></p>`;

      const finalHtml = `${rendered.html}${openPixelHtml}${footerHtml}`;

      jobsToCreate.push({
        id: jobId,
        campaignId: campaign.id,
        recipientEmail: lead.email,
        recipientName: `${lead.firstName} ${lead.lastName}`.trim() || lead.email,
        status: "queued",
      });

      queueJobs.push({
        jobId,
        campaignId: campaign.id,
        workspaceId,
        to: lead.email,
        recipientName: `${lead.firstName} ${lead.lastName}`.trim(),
        subject: rendered.subject,
        html: finalHtml,
        text: rendered.text,
      });
    }

    // Batch insert DB EmailJob records
    await prisma.emailJob.createMany({ data: jobsToCreate });

    // Queue for background dispatch
    await emailQueue.addBulk(queueJobs);

    // Update campaign status to sent
    const updatedCampaign = await prisma.emailCampaign.update({
      where: { id: campaign.id },
      data: { status: "sent", sentAt: new Date() },
    });

    return { campaign: updatedCampaign, dispatchedCount: leads.length };
  }

  async sendSingleEmail(input: SingleSendInput, workspaceId: string) {
    const jobId = `job_${randomUUID().slice(0, 8)}`;
    const variables = input.variables || {};
    const rendered = renderEmailTemplate(
      { subject: input.subject, html: input.html, text: input.text || input.html.replace(/<[^>]+>/g, "") },
      variables,
    );

    await emailQueue.add({
      jobId,
      workspaceId,
      to: input.to,
      recipientName: input.recipientName,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });

    return { jobId, to: input.to, status: "queued" };
  }

  // ─────────────────────────────────────────────
  // TRACKING EVENTS & SUPPRESSIONS
  // ─────────────────────────────────────────────

  async recordOpenEvent(campaignId: string, messageId: string, recipientEmail: string) {
    if (campaignId) {
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: { openCount: { increment: 1 } },
      }).catch(() => null);

      await prisma.emailEvent.create({
        data: {
          id: `evt_${randomUUID().slice(0, 8)}`,
          campaignId,
          recipientEmail: recipientEmail || "unknown",
          eventType: "open",
        },
      }).catch(() => null);
    }
  }

  async recordClickEvent(campaignId: string, messageId: string, recipientEmail: string, targetUrl: string) {
    if (campaignId) {
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: { clickCount: { increment: 1 } },
      }).catch(() => null);

      await prisma.emailEvent.create({
        data: {
          id: `evt_${randomUUID().slice(0, 8)}`,
          campaignId,
          recipientEmail: recipientEmail || "unknown",
          eventType: "click",
          url: targetUrl,
        },
      }).catch(() => null);
    }
  }

  async addSuppression(workspaceId: string, email: string, reason = "unsubscribe") {
    return prisma.emailSuppression.upsert({
      where: { workspaceId_email: { workspaceId, email } },
      update: { reason },
      create: {
        id: `sup_${randomUUID().slice(0, 8)}`,
        workspaceId,
        email,
        reason,
      },
    });
  }

  async listSuppressions(workspaceId: string) {
    return prisma.emailSuppression.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });
  }

  async removeSuppression(suppressionId: string, workspaceId: string) {
    const existing = await prisma.emailSuppression.findFirst({ where: { id: suppressionId, workspaceId } });
    if (!existing) return null;
    await prisma.emailSuppression.delete({ where: { id: existing.id } });
    return { success: true };
  }
}
