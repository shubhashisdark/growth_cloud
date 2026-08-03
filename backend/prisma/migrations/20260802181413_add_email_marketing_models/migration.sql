-- CreateEnum
CREATE TYPE "public"."CampaignStatus" AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled');

-- CreateTable
CREATE TABLE "public"."EmailTemplate" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "textContent" TEXT NOT NULL,
    "variablesJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmailCampaign" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "fromName" TEXT NOT NULL DEFAULT 'Growth Cloud',
    "fromEmail" TEXT,
    "templateId" TEXT,
    "status" "public"."CampaignStatus" NOT NULL DEFAULT 'draft',
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "totalRecipients" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "openCount" INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "bounceCount" INTEGER NOT NULL DEFAULT 0,
    "unsubscribeCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmailJob" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "recipientName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "messageId" TEXT,
    "attemptedProviders" TEXT NOT NULL DEFAULT '[]',
    "sentAt" TIMESTAMP(3),
    "openCount" INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmailEvent" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "url" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadataJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmailSuppression" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT 'unsubscribe',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailSuppression_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailTemplate_workspaceId_idx" ON "public"."EmailTemplate"("workspaceId");

-- CreateIndex
CREATE INDEX "EmailCampaign_workspaceId_idx" ON "public"."EmailCampaign"("workspaceId");

-- CreateIndex
CREATE INDEX "EmailCampaign_workspaceId_status_idx" ON "public"."EmailCampaign"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "EmailJob_campaignId_idx" ON "public"."EmailJob"("campaignId");

-- CreateIndex
CREATE INDEX "EmailJob_recipientEmail_idx" ON "public"."EmailJob"("recipientEmail");

-- CreateIndex
CREATE INDEX "EmailEvent_campaignId_eventType_idx" ON "public"."EmailEvent"("campaignId", "eventType");

-- CreateIndex
CREATE INDEX "EmailEvent_recipientEmail_idx" ON "public"."EmailEvent"("recipientEmail");

-- CreateIndex
CREATE INDEX "EmailSuppression_workspaceId_idx" ON "public"."EmailSuppression"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailSuppression_workspaceId_email_key" ON "public"."EmailSuppression"("workspaceId", "email");

-- AddForeignKey
ALTER TABLE "public"."EmailTemplate" ADD CONSTRAINT "EmailTemplate_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmailCampaign" ADD CONSTRAINT "EmailCampaign_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmailCampaign" ADD CONSTRAINT "EmailCampaign_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."EmailTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmailJob" ADD CONSTRAINT "EmailJob_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."EmailCampaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmailEvent" ADD CONSTRAINT "EmailEvent_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."EmailCampaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmailSuppression" ADD CONSTRAINT "EmailSuppression_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
