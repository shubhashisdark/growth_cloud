-- CreateEnum
CREATE TYPE "public"."WebhookSubscriptionStatus" AS ENUM ('active', 'paused', 'disabled');

-- CreateTable
CREATE TABLE "public"."WebhookSubscription" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "eventsJson" TEXT NOT NULL DEFAULT '[]',
    "status" "public"."WebhookSubscriptionStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WebhookDeliveryLog" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "statusCode" INTEGER,
    "responseBody" TEXT,
    "durationMs" INTEGER,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "nextRetryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookDeliveryLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WebhookSubscription_workspaceId_idx" ON "public"."WebhookSubscription"("workspaceId");

-- CreateIndex
CREATE INDEX "WebhookSubscription_workspaceId_status_idx" ON "public"."WebhookSubscription"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "WebhookDeliveryLog_subscriptionId_createdAt_idx" ON "public"."WebhookDeliveryLog"("subscriptionId", "createdAt");

-- CreateIndex
CREATE INDEX "WebhookDeliveryLog_subscriptionId_status_idx" ON "public"."WebhookDeliveryLog"("subscriptionId", "status");

-- AddForeignKey
ALTER TABLE "public"."WebhookSubscription" ADD CONSTRAINT "WebhookSubscription_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WebhookDeliveryLog" ADD CONSTRAINT "WebhookDeliveryLog_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."WebhookSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
