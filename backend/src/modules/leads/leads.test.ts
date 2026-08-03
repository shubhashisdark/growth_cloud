import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { randomUUID } from "node:crypto";

import { prisma } from "../../data/prisma.js";
import { LeadsService } from "./leads.service.js";

const svc = new LeadsService();

/**
 * Create a test workspace so FK constraints are satisfied.
 */
async function createTestWorkspace() {
  const wsId = `ws_test_leads_${randomUUID().slice(0, 6)}`;
  const userId = `user_test_${randomUUID().slice(0, 6)}`;

  await prisma.user.create({
    data: {
      id: userId,
      name: "Test User",
      email: `testuser_${randomUUID().slice(0, 6)}@example.com`,
      passwordHash: "hashed",
      status: "active",
    },
  });

  await prisma.workspace.create({
    data: {
      id: wsId,
      name: "Test WS",
      slug: `test-ws-${randomUUID().slice(0, 6)}`,
      plan: "free",
      timezone: "UTC",
      status: "active",
      ownerId: userId,
    },
  });

  return { wsId, userId };
}

describe("LeadsService — full lifecycle", async () => {
  const { wsId, userId: _userId } = await createTestWorkspace();

  let leadId = "";
  let importedLeadEmail = `import_${randomUUID().slice(0, 6)}@test.com`;

  it("creates a lead with consent records", async () => {
    const lead = await svc.createLead(
      {
        email: `test_${randomUUID().slice(0, 6)}@example.com`,
        firstName: "Jane",
        lastName: "Doe",
        company: "Acme",
        source: "Organic",
        lifecycleStage: "lead",
        tags: ["crm", "vip"],
        consentEmail: true,
        consentSms: false,
        customFields: { region: "us-east" },
      },
      wsId,
    );

    assert.ok(lead.id.startsWith("lead_"));
    assert.equal(lead.lifecycleStage, "lead");
    leadId = lead.id;
  });

  it("lists leads with search and pagination", async () => {
    const result = await svc.listLeads(
      { q: "Jane", page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" },
      wsId,
    );
    assert.ok(result.data.items.length >= 1);
    assert.equal(result.meta.page, 1);
  });

  it("fetches single lead with timeline", async () => {
    assert.ok(leadId, "leadId must be set by previous test");
    const detail = await svc.getLead(leadId, wsId);
    assert.ok(detail);
    assert.ok(Array.isArray(detail.timeline));
    assert.ok(detail.timeline.some((e) => e.type === "lead.created"));
  });

  it("returns null for wrong workspace (isolation)", async () => {
    assert.ok(leadId, "leadId must be set");
    const result = await svc.getLead(leadId, "ws_other_workspace");
    assert.equal(result, null, "Should return null for wrong workspace");
  });

  it("updates lead fields partially", async () => {
    assert.ok(leadId, "leadId must be set");
    const updated = await svc.updateLead(leadId, { company: "Acme Updated", lifecycleStage: "mql" }, wsId);
    assert.ok(updated);
    assert.equal(updated.company, "Acme Updated");
    assert.equal(updated.lifecycleStage, "mql");
  });

  it("adds a note", async () => {
    assert.ok(leadId, "leadId must be set");
    const note = await svc.addNote(leadId, { note: "Talked on call", author: "user_1" }, wsId);
    assert.ok(note);
    assert.ok(note.id.startsWith("note_"));
  });

  it("adds a timeline event", async () => {
    assert.ok(leadId, "leadId must be set");
    const evt = await svc.addTimelineEvent(leadId, { note: "Sent follow-up email" }, wsId);
    assert.ok(evt);
  });

  it("timeline has note and timeline events", async () => {
    assert.ok(leadId, "leadId must be set");
    const detail = await svc.getLead(leadId, wsId);
    assert.ok(detail?.timeline.some((e) => e.type === "note.created"));
    assert.ok(detail?.timeline.some((e) => e.type === "timeline.note"));
  });

  it("updates consent for a lead", async () => {
    assert.ok(leadId, "leadId must be set");
    const consent = await svc.updateConsent(leadId, { type: "sms", granted: true }, wsId);
    assert.ok(consent, "consent record must be returned");
    assert.equal(consent!.type, "sms");
    assert.equal(consent!.granted, true);
  });

  it("bulk archives leads", async () => {
    assert.ok(leadId, "leadId must be set");
    const result = await svc.bulkUpdate({ leadIds: [leadId], action: "archive" }, wsId);
    assert.equal(result.updated, 1);
  });

  it("bulk re-activates leads", async () => {
    assert.ok(leadId, "leadId must be set");
    const result = await svc.bulkUpdate({ leadIds: [leadId], action: "activate" }, wsId);
    assert.equal(result.updated, 1);
  });

  it("exports CSV scoped to workspace (contains created lead)", async () => {
    assert.ok(leadId, "leadId must be set");
    const csv = await svc.exportLeads(wsId);
    assert.ok(csv.startsWith("id,email,firstName"), "CSV must start with header");
    assert.ok(csv.includes(leadId), `CSV must contain leadId=${leadId}`);
  });

  it("imports CSV rows and creates leads", async () => {
    const csvBody = [
      "email,firstName,lastName,company,source,lifecycleStage",
      `${importedLeadEmail},Import,User,TestCo,CSV,lead`,
    ].join("\n");
    const result = await svc.importLeads(csvBody, wsId);
    assert.equal(result.imported, 1);
    assert.equal(result.errors.length, 0, `Expected no errors, got: ${JSON.stringify(result.errors)}`);
  });

  it("skips duplicate emails on second import", async () => {
    const csvBody = [
      "email,firstName,lastName,company,source,lifecycleStage",
      `${importedLeadEmail},Import,User,TestCo,CSV,lead`,
    ].join("\n");
    const result = await svc.importLeads(csvBody, wsId);
    assert.equal(result.imported, 0);
    assert.ok(result.errors.length >= 1, "Should have a duplicate-skip error message");
  });

  it("soft-deletes (archives) a lead", async () => {
    assert.ok(leadId, "leadId must be set");
    const result = await svc.deleteLead(leadId, wsId);
    assert.ok(result);
    assert.equal(result.status, "archived");
  });

  it("returns null when deleting lead from wrong workspace", async () => {
    assert.ok(leadId, "leadId must be set");
    const result = await svc.deleteLead(leadId, "ws_wrong");
    assert.equal(result, null);
  });
});
