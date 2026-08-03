import { randomUUID } from "node:crypto";
import { prisma } from "../../data/prisma.js";
import { generateWebhookSecret, signWebhookPayload } from "./webhook.crypto.js";
const MAX_RETRY_ATTEMPTS = 3;
export async function createSubscription(input) {
    const secret = generateWebhookSecret();
    const created = await prisma.webhookSubscription.create({
        data: {
            id: `wh_${randomUUID().replace(/-/g, "").slice(0, 12)}`,
            workspaceId: input.workspaceId,
            name: input.name,
            targetUrl: input.targetUrl,
            secret,
            eventsJson: JSON.stringify(input.events),
            status: "active",
        },
    });
    return {
        ...created,
        events: JSON.parse(created.eventsJson),
    };
}
export async function listSubscriptions(workspaceId) {
    const subscriptions = await prisma.webhookSubscription.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "desc" },
    });
    return subscriptions.map((s) => ({
        ...s,
        events: JSON.parse(s.eventsJson),
    }));
}
export async function getSubscription(id, workspaceId) {
    const sub = await prisma.webhookSubscription.findFirst({
        where: { id, workspaceId },
    });
    if (!sub)
        return null;
    return {
        ...sub,
        events: JSON.parse(sub.eventsJson),
    };
}
export async function updateSubscription(id, workspaceId, input) {
    const existing = await prisma.webhookSubscription.findFirst({ where: { id, workspaceId } });
    if (!existing)
        return null;
    const updated = await prisma.webhookSubscription.update({
        where: { id },
        data: {
            name: input.name ?? existing.name,
            targetUrl: input.targetUrl ?? existing.targetUrl,
            eventsJson: input.events ? JSON.stringify(input.events) : existing.eventsJson,
            status: input.status ?? existing.status,
        },
    });
    return {
        ...updated,
        events: JSON.parse(updated.eventsJson),
    };
}
export async function deleteSubscription(id, workspaceId) {
    const existing = await prisma.webhookSubscription.findFirst({ where: { id, workspaceId } });
    if (!existing)
        return false;
    await prisma.webhookSubscription.delete({ where: { id } });
    return true;
}
export async function rotateSubscriptionSecret(id, workspaceId) {
    const existing = await prisma.webhookSubscription.findFirst({ where: { id, workspaceId } });
    if (!existing)
        return null;
    const newSecret = generateWebhookSecret();
    const updated = await prisma.webhookSubscription.update({
        where: { id },
        data: { secret: newSecret },
    });
    return {
        ...updated,
        events: JSON.parse(updated.eventsJson),
    };
}
export async function deliverWebhook(subscription, event, payload, attempt = 1, existingDeliveryId) {
    const payloadJson = JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        data: payload,
    });
    const signature = signWebhookPayload(payloadJson, subscription.secret);
    const deliveryId = existingDeliveryId ?? `whd_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
    if (!existingDeliveryId) {
        await prisma.webhookDeliveryLog.create({
            data: {
                id: deliveryId,
                subscriptionId: subscription.id,
                event,
                payloadJson,
                attempt,
                status: "pending",
            },
        });
    }
    const startTime = Date.now();
    let statusCode;
    let responseBody = "";
    let success = false;
    let errorMessage = null;
    try {
        const res = await fetch(subscription.targetUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-GrowthCloud-Event": event,
                "X-GrowthCloud-Signature": signature,
                "User-Agent": "GrowthCloud-Webhooks/1.0",
            },
            body: payloadJson,
            signal: AbortSignal.timeout(10000),
        });
        statusCode = res.status;
        responseBody = (await res.text()).slice(0, 1000);
        success = res.ok;
        if (!success) {
            errorMessage = `HTTP status ${res.status}`;
        }
    }
    catch (err) {
        errorMessage = err instanceof Error ? err.message : "Network error / timeout";
    }
    const durationMs = Date.now() - startTime;
    // Determine retry if failed
    let nextRetryAt = null;
    let finalStatus = success ? "success" : "failed";
    if (!success && attempt < MAX_RETRY_ATTEMPTS) {
        const backoffSeconds = Math.pow(2, attempt) * 5; // Exponential backoff: 10s, 20s
        nextRetryAt = new Date(Date.now() + backoffSeconds * 1000);
        finalStatus = "retrying";
    }
    const updatedLog = await prisma.webhookDeliveryLog.update({
        where: { id: deliveryId },
        data: {
            statusCode,
            responseBody,
            durationMs,
            attempt,
            status: finalStatus,
            errorMessage,
            nextRetryAt,
        },
    });
    return updatedLog;
}
export async function dispatchWebhookEvent(workspaceId, event, payload) {
    const subscriptions = await prisma.webhookSubscription.findMany({
        where: { workspaceId, status: "active" },
    });
    const matchingSubscriptions = subscriptions.filter((sub) => {
        const events = JSON.parse(sub.eventsJson);
        return events.includes(event) || events.includes("*");
    });
    const results = await Promise.allSettled(matchingSubscriptions.map((sub) => deliverWebhook(sub, event, payload)));
    return {
        dispatchedCount: matchingSubscriptions.length,
        successCount: results.filter((r) => r.status === "fulfilled" && r.value.status === "success").length,
    };
}
export async function listDeliveryLogs(subscriptionId, page = 1, limit = 20) {
    const [items, total] = await Promise.all([
        prisma.webhookDeliveryLog.findMany({
            where: { subscriptionId },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.webhookDeliveryLog.count({ where: { subscriptionId } }),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
}
export async function replayDeliveryLog(deliveryId) {
    const log = await prisma.webhookDeliveryLog.findUnique({
        where: { id: deliveryId },
        include: { subscription: true },
    });
    if (!log || !log.subscription) {
        throw new Error("Delivery log or subscription not found");
    }
    const payloadObj = JSON.parse(log.payloadJson);
    return deliverWebhook(log.subscription, log.event, payloadObj.data ?? payloadObj, log.attempt + 1, log.id);
}
