import { randomUUID } from "node:crypto";
import { createHash, randomBytes } from "node:crypto";
import { URL } from "node:url";

import { getConfig } from "../../config/env.js";

export type EmailProviderName = "resend" | "brevo" | "console";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface SentEmailReceipt {
  provider: EmailProviderName;
  from: string;
  to: string;
  messageId: string;
}

export interface EmailProvider {
  name: EmailProviderName;
  send(message: EmailMessage): Promise<SentEmailReceipt>;
}

function assertFromAddress(value: string | null | undefined, providerName: string) {
  if (!value || value.trim() === "") {
    throw new Error(`${providerName} requires EMAIL_FROM to be configured`);
  }
  return value;
}

function htmlToText(html: string) {
  return html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*\/p\s*>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .trim();
}

class ConsoleEmailProvider implements EmailProvider {
  name: EmailProviderName = "console";

  async send(message: EmailMessage): Promise<SentEmailReceipt> {
    const from = assertFromAddress(getConfig().emailFrom, this.name);
    const messageId = `msg_${randomUUID().slice(0, 12)}`;

    console.log(
      JSON.stringify(
        {
          emailProvider: this.name,
          from,
          to: message.to,
          subject: message.subject,
          messageId
        },
        null,
        2
      )
    );

    return {
      provider: this.name,
      from,
      to: message.to,
      messageId
    };
  }
}

class ResendEmailProvider implements EmailProvider {
  name: EmailProviderName = "resend";

  async send(message: EmailMessage): Promise<SentEmailReceipt> {
    const config = getConfig();
    const apiKey = config.resendApiKey;
    const from = assertFromAddress(config.emailFrom, this.name);

    if (!apiKey) {
      throw new Error("RESEND_API_KEY is required when EMAIL_PROVIDER is resend");
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text
      })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Resend send failed (${response.status}): ${body}`);
    }

    const payload = (await response.json()) as { id?: string };

    return {
      provider: this.name,
      from,
      to: message.to,
      messageId: payload.id ?? `resend_${randomUUID().slice(0, 12)}`
    };
  }
}

class BrevoEmailProvider implements EmailProvider {
  name: EmailProviderName = "brevo";

  async send(message: EmailMessage): Promise<SentEmailReceipt> {
    const config = getConfig();
    const apiKey = config.brevoApiKey;
    const from = assertFromAddress(config.emailFrom, this.name);

    if (!apiKey) {
      throw new Error("BREVO_API_KEY is required when EMAIL_PROVIDER is brevo");
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "api-key": apiKey
      },
      body: JSON.stringify({
        sender: { email: from },
        to: [{ email: message.to }],
        subject: message.subject,
        htmlContent: message.html,
        textContent: message.text
      })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Brevo send failed (${response.status}): ${body}`);
    }

    const payload = (await response.json()) as { messageId?: string };

    return {
      provider: this.name,
      from,
      to: message.to,
      messageId: payload.messageId ?? `brevo_${randomUUID().slice(0, 12)}`
    };
  }
}

function createProvider(name: EmailProviderName): EmailProvider {
  if (name === "resend") return new ResendEmailProvider();
  if (name === "brevo") return new BrevoEmailProvider();
  return new ConsoleEmailProvider();
}

function parseProviderName(value: string | null | undefined, fallback: EmailProviderName): EmailProviderName {
  if (value === "resend" || value === "brevo" || value === "console") {
    return value;
  }
  return fallback;
}

export function getEmailProviders() {
  const config = getConfig();
  const primary = createProvider(parseProviderName(config.emailProvider, "console"));
  const fallback = config.emailFallbackProvider ? createProvider(parseProviderName(config.emailFallbackProvider, "console")) : null;

  return {
    primary,
    fallback
  };
}

export async function sendEmailWithFallback(message: EmailMessage) {
  const { primary, fallback } = getEmailProviders();
  const errors: Array<{ provider: EmailProviderName; error: string }> = [];

  try {
    const receipt = await primary.send(message);
    return { ...receipt, attemptedProviders: [primary.name] as EmailProviderName[] };
  } catch (error) {
    errors.push({
      provider: primary.name,
      error: error instanceof Error ? error.message : String(error)
    });
  }

  if (!fallback || fallback.name === primary.name) {
    const failure = errors[0];
    throw new Error(
      `Email delivery failed via ${failure.provider}: ${failure.error}`
    );
  }

  try {
    const receipt = await fallback.send(message);
    return { ...receipt, attemptedProviders: [primary.name, fallback.name] as EmailProviderName[] };
  } catch (error) {
    errors.push({
      provider: fallback.name,
      error: error instanceof Error ? error.message : String(error)
    });
  }

  throw new Error(
    `Email delivery failed via ${errors.map((item) => item.provider).join(" and ")}: ${errors.map((item) => item.error).join(" | ")}`
  );
}

export function renderEmailTemplate(
  template: { subject: string; html: string; text: string },
  variables: Record<string, string>
) {
  const replaceVariables = (value: string) =>
    value.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_match, key: string) => variables[key] ?? "");

  return {
    subject: replaceVariables(template.subject),
    html: replaceVariables(template.html),
    text: replaceVariables(template.text)
  };
}

export function createCampaignKeyMaterial() {
  const publicSuffix = randomBytes(8).toString("hex");
  const secretSuffix = randomBytes(16).toString("hex");
  const publicKey = `gc_pub_${publicSuffix}`;
  const secretKey = `gc_live_${secretSuffix}`;

  return {
    publicKey,
    secretKey,
    publicPrefix: publicKey.slice(0, 12),
    secretPrefix: secretKey.slice(0, 13),
    publicHash: createHash("sha256").update(publicKey).digest("hex"),
    secretHash: createHash("sha256").update(secretKey).digest("hex")
  };
}

export function buildTrackingUrls({
  baseUrl,
  campaignId,
  messageId,
  recipientId
}: {
  baseUrl: string;
  campaignId: string;
  messageId: string;
  recipientId: string;
}) {
  const base = new URL(baseUrl);
  const openPixelUrl = new URL("/api/v1/tracking/open", base);
  openPixelUrl.searchParams.set("campaignId", campaignId);
  openPixelUrl.searchParams.set("messageId", messageId);
  openPixelUrl.searchParams.set("recipientId", recipientId);

  const clickRedirectUrl = new URL("/api/v1/tracking/click", base);
  clickRedirectUrl.searchParams.set("campaignId", campaignId);
  clickRedirectUrl.searchParams.set("messageId", messageId);
  clickRedirectUrl.searchParams.set("recipientId", recipientId);

  return {
    openPixelUrl: openPixelUrl.toString(),
    clickRedirectUrl: clickRedirectUrl.toString()
  };
}

export function buildWelcomeEmail(name: string, workspaceName: string) {
  const subject = "Welcome to Growth Cloud";
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h1>Welcome, ${name}!</h1>
      <p>Your workspace <strong>${workspaceName}</strong> is ready.</p>
      <p>Growth Cloud helps you:</p>
      <ul>
        <li>capture and manage leads</li>
        <li>build automated workflows</li>
        <li>score and segment contacts</li>
        <li>track analytics and campaign performance</li>
      </ul>
      <p>Log in to connect integrations and start your first automation.</p>
    </div>
  `;
  return {
    subject,
    html,
    text: htmlToText(html)
  };
}

export function buildVerificationEmail(name: string, verifyUrl: string) {
  const subject = "Verify your Growth Cloud email address";
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h1>Verify your email address</h1>
      <p>Hi ${name},</p>
      <p>Thanks for signing up for Growth Cloud. Please verify your email address by clicking the link below:</p>
      <p><a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#38BDF8;color:#0B0F1A;text-decoration:none;border-radius:8px;font-weight:bold;">Verify Email Address</a></p>
      <p>Or copy and paste this link into your browser:</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>This link expires in 24 hours. If you did not create an account, you can safely ignore this email.</p>
    </div>
  `;
  return {
    subject,
    html,
    text: htmlToText(html)
  };
}

export function buildResetPasswordEmail(name: string, resetUrl: string) {
  const subject = "Reset your Growth Cloud password";
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h1>Password reset requested</h1>
      <p>Hi ${name},</p>
      <p>Use the link below to reset your password:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>If you did not request this, you can ignore this message.</p>
    </div>
  `;
  return {
    subject,
    html,
    text: htmlToText(html)
  };
}

export function buildInvitationEmail(inviterName: string, workspaceName: string, inviteUrl: string) {
  const subject = `You've been invited to join ${workspaceName} on Growth Cloud`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h1>Team Invitation</h1>
      <p>Hi there,</p>
      <p><strong>${inviterName}</strong> has invited you to join the <strong>${workspaceName}</strong> workspace on Growth Cloud.</p>
      <p>Click the link below to accept your invitation and join the team:</p>
      <p><a href="${inviteUrl}">${inviteUrl}</a></p>
      <p>If you were not expecting this invitation, you can safely ignore this email.</p>
    </div>
  `;
  return {
    subject,
    html,
    text: htmlToText(html)
  };
}

