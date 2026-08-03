import { describe, it } from "node:test";
import assert from "node:assert/strict";

import * as emailService from "./email.service.js";

describe("email.service", () => {
  it("renders personalized campaign templates", () => {
    const template = emailService.renderEmailTemplate({
      subject: "Welcome {{firstName}}",
      html: "<p>Hello {{firstName}} from {{workspaceName}}</p><p>Visit {{ctaUrl}}</p>",
      text: "Hello {{firstName}} from {{workspaceName}}\nVisit {{ctaUrl}}"
    }, {
      firstName: "Maya",
      workspaceName: "Northstar",
      ctaUrl: "https://example.com"
    });

    assert.equal(template.subject, "Welcome Maya");
    assert.equal(template.html, "<p>Hello Maya from Northstar</p><p>Visit https://example.com</p>");
    assert.equal(template.text, "Hello Maya from Northstar\nVisit https://example.com");
  });

  it("generates api key material with prefixes and hashes", () => {
    const material = emailService.createCampaignKeyMaterial();
    assert.equal(material.publicKey.startsWith("gc_pub_"), true);
    assert.equal(material.secretKey.startsWith("gc_live_"), true);
    assert.equal(material.publicPrefix.length > 0, true);
    assert.equal(material.secretPrefix.length > 0, true);
    assert.equal(material.publicHash.length, 64);
    assert.equal(material.secretHash.length, 64);
  });

  it("creates tracking urls containing message and event identifiers", () => {
    const tracking = emailService.buildTrackingUrls({
      baseUrl: "https://app.example.com",
      campaignId: "cmp_1",
      messageId: "msg_1",
      recipientId: "rct_1"
    });

    assert.equal(tracking.openPixelUrl, "https://app.example.com/api/v1/tracking/open?campaignId=cmp_1&messageId=msg_1&recipientId=rct_1");
    assert.equal(tracking.clickRedirectUrl, "https://app.example.com/api/v1/tracking/click?campaignId=cmp_1&messageId=msg_1&recipientId=rct_1");
  });
});