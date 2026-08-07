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
      baseUrl: "https://api.example.com",
      campaignId: "cmp_1",
      messageId: "msg_1",
      recipientId: "rct_1",
      recipientEmail: "maya@example.com",
    });

    assert.equal(
      tracking.openPixelUrl,
      "https://api.example.com/api/v1/email/tracking/open?campaignId=cmp_1&messageId=msg_1&recipientId=rct_1&recipientEmail=maya%40example.com",
    );
    assert.equal(
      tracking.clickRedirectUrl,
      "https://api.example.com/api/v1/email/tracking/click?campaignId=cmp_1&messageId=msg_1&recipientId=rct_1&recipientEmail=maya%40example.com",
    );
  });

  it("wraps http links with click tracking and skips mailto/unsubscribe", () => {
    const clickBase =
      "https://api.example.com/api/v1/email/tracking/click?campaignId=cmp_1&messageId=msg_1&recipientId=lead_1";
    const html = `
      <a href="https://ecommerce1-gold.vercel.app/">Visit Website</a>
      <a href="mailto:help@example.com">Email us</a>
      <a href="https://api.example.com/api/v1/email/tracking/unsubscribe?email=a@b.com">Unsubscribe</a>
    `;
    const wrapped = emailService.wrapHtmlLinksForClickTracking(html, clickBase);
    assert.match(wrapped, /tracking\/click\?.*url=https%3A%2F%2Fecommerce1-gold\.vercel\.app%2F/);
    assert.match(wrapped, /href="mailto:help@example.com"/);
    assert.match(wrapped, /tracking\/unsubscribe\?email=a@b.com/);
  });
});