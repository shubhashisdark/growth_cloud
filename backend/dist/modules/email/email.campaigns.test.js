import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { randomUUID } from "node:crypto";
import { prisma } from "../../data/prisma.js";
import { EmailCampaignsService } from "./email.campaigns.service.js";
import { renderEmailTemplate } from "./email.service.js";
const service = new EmailCampaignsService();
async function createTestWorkspace() {
    const wsId = `ws_test_email_${randomUUID().slice(0, 6)}`;
    const userId = `user_test_${randomUUID().slice(0, 6)}`;
    await prisma.user.create({
        data: {
            id: userId,
            name: "Email Tester",
            email: `emailtester_${randomUUID().slice(0, 6)}@example.com`,
            passwordHash: "hashed",
            status: "active",
        },
    });
    await prisma.workspace.create({
        data: {
            id: wsId,
            name: "Email Test Workspace",
            slug: `email-ws-${randomUUID().slice(0, 6)}`,
            plan: "free",
            timezone: "UTC",
            status: "active",
            ownerId: userId,
        },
    });
    return { wsId, userId };
}
describe("Email Marketing — Templates & Campaigns Service", async () => {
    const { wsId } = await createTestWorkspace();
    let templateId = "";
    let campaignId = "";
    it("renders templates with variable substitutions", () => {
        const template = {
            subject: "Hello {{firstName}} from {{company}}",
            html: "<h1>Welcome {{firstName}}!</h1><p>Your email is {{email}}.</p>",
            text: "Welcome {{firstName}}!",
        };
        const vars = { firstName: "Alice", company: "Acme", email: "alice@acme.com" };
        const rendered = renderEmailTemplate(template, vars);
        assert.equal(rendered.subject, "Hello Alice from Acme");
        assert.equal(rendered.html, "<h1>Welcome Alice!</h1><p>Your email is alice@acme.com.</p>");
    });
    it("creates an email template", async () => {
        const tpl = await service.createTemplate({
            name: "Welcome Onboarding Template",
            subject: "Welcome {{firstName}}",
            htmlContent: "<h1>Hi {{firstName}}</h1>",
            variables: ["firstName"],
        }, wsId);
        assert.ok(tpl.id.startsWith("tpl_"));
        assert.equal(tpl.name, "Welcome Onboarding Template");
        templateId = tpl.id;
    });
    it("lists email templates for workspace", async () => {
        const list = await service.listTemplates(wsId);
        assert.ok(list.length >= 1);
        assert.equal(list[0].id, templateId);
    });
    it("creates an email campaign", async () => {
        const campaign = await service.createCampaign({
            name: "Q3 Announcement",
            subject: "New features released!",
            fromName: "Marketing Team",
            templateId,
        }, wsId);
        assert.ok(campaign.id.startsWith("cmp_"));
        assert.equal(campaign.status, "draft");
        campaignId = campaign.id;
    });
    it("fetches single campaign detail", async () => {
        const fetched = await service.getCampaign(campaignId, wsId);
        assert.ok(fetched);
        assert.equal(fetched.name, "Q3 Announcement");
    });
    it("adds an email to suppression list", async () => {
        const sup = await service.addSuppression(wsId, "unsubscribed@example.com", "unsubscribe");
        assert.ok(sup);
        assert.equal(sup.email, "unsubscribed@example.com");
    });
    it("lists workspace suppressions", async () => {
        const list = await service.listSuppressions(wsId);
        assert.ok(list.length >= 1);
        assert.equal(list[0].email, "unsubscribed@example.com");
    });
    it("dispatches single email to queue", async () => {
        const single = await service.sendSingleEmail({
            to: "single_target@example.com",
            subject: "Order Confirmation",
            html: "<p>Thank you for your order!</p>",
        }, wsId);
        assert.ok(single.jobId.startsWith("job_"));
        assert.equal(single.status, "queued");
    });
    it("dispatches bulk campaign send to active workspace leads", async () => {
        // Create a dummy lead in workspace
        await prisma.lead.create({
            data: {
                id: `lead_${randomUUID().slice(0, 8)}`,
                workspaceId: wsId,
                email: `campaign_lead_${randomUUID().slice(0, 6)}@example.com`,
                firstName: "Bob",
                lastName: "Smith",
                company: "TechCorp",
                source: "Inbound",
                status: "active",
                score: 10,
                lifecycleStage: "lead",
            },
        });
        const result = await service.sendCampaign(campaignId, wsId);
        assert.ok(result);
        assert.ok(result.dispatchedCount >= 1);
        assert.equal(result.campaign.status, "sent");
    });
    it("records open tracking event", async () => {
        await service.recordOpenEvent(campaignId, "msg_123", "bob@techcorp.com");
        const cmp = await service.getCampaign(campaignId, wsId);
        assert.ok(cmp);
        assert.ok(cmp.openCount >= 1);
    });
    it("records click tracking event", async () => {
        await service.recordClickEvent(campaignId, "msg_123", "bob@techcorp.com", "https://example.com/demo");
        const cmp = await service.getCampaign(campaignId, wsId);
        assert.ok(cmp);
        assert.ok(cmp.clickCount >= 1);
    });
    it("deletes a campaign", async () => {
        const deleted = await service.deleteCampaign(campaignId, wsId);
        assert.ok(deleted);
        assert.equal(deleted.success, true);
    });
    it("deletes a template", async () => {
        const deleted = await service.deleteTemplate(templateId, wsId);
        assert.ok(deleted);
        assert.equal(deleted.success, true);
    });
});
