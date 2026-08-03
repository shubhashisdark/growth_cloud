import { createHmac, randomBytes } from "node:crypto";

export function generateWebhookSecret(): string {
  return `whsec_${randomBytes(24).toString("hex")}`;
}

export function signWebhookPayload(payloadJson: string, secret: string, timestamp = Math.floor(Date.now() / 1000)): string {
  const signaturePayload = `${timestamp}.${payloadJson}`;
  const hmac = createHmac("sha256", secret).update(signaturePayload).digest("hex");
  return `t=${timestamp},v1=${hmac}`;
}

export function verifyWebhookSignature(payloadJson: string, headerSignature: string, secret: string, toleranceSeconds = 300): boolean {
  try {
    const parts = headerSignature.split(",");
    const tPart = parts.find((p) => p.startsWith("t="));
    const v1Part = parts.find((p) => p.startsWith("v1="));

    if (!tPart || !v1Part) return false;

    const timestamp = parseInt(tPart.slice(2), 10);
    const expectedSignature = v1Part.slice(3);

    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > toleranceSeconds) return false;

    const calculatedSignature = createHmac("sha256", secret)
      .update(`${timestamp}.${payloadJson}`)
      .digest("hex");

    return calculatedSignature === expectedSignature;
  } catch {
    return false;
  }
}
