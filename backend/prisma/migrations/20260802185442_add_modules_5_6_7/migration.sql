-- CreateEnum
CREATE TYPE "public"."WorkflowRunStatus" AS ENUM ('running', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "public"."ScoringRuleType" AS ENUM ('positive', 'negative');

-- AlterTable
ALTER TABLE "public"."Lead" ADD COLUMN     "scoreUpdatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."Segment" ADD COLUMN     "description" TEXT,
ADD COLUMN     "lastComputedAt" TIMESTAMP(3),
ADD COLUMN     "memberCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."Workflow" ADD COLUMN     "description" TEXT,
ADD COLUMN     "errorCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "runCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."SegmentMembership" (
    "id" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SegmentMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkflowRun" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "leadId" TEXT,
    "status" "public"."WorkflowRunStatus" NOT NULL DEFAULT 'running',
    "triggerEvent" TEXT NOT NULL,
    "inputJson" TEXT NOT NULL DEFAULT '{}',
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "WorkflowRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkflowStepLog" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "stepIndex" INTEGER NOT NULL,
    "stepType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "inputJson" TEXT NOT NULL DEFAULT '{}',
    "outputJson" TEXT NOT NULL DEFAULT '{}',
    "errorMessage" TEXT,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowStepLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ScoringRule" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."ScoringRuleType" NOT NULL,
    "conditionJson" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScoringRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ScoreHistory" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "ruleId" TEXT,
    "scoreBefore" INTEGER NOT NULL,
    "scoreAfter" INTEGER NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoreHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SegmentMembership_segmentId_idx" ON "public"."SegmentMembership"("segmentId");

-- CreateIndex
CREATE INDEX "SegmentMembership_leadId_idx" ON "public"."SegmentMembership"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "SegmentMembership_segmentId_leadId_key" ON "public"."SegmentMembership"("segmentId", "leadId");

-- CreateIndex
CREATE INDEX "WorkflowRun_workflowId_startedAt_idx" ON "public"."WorkflowRun"("workflowId", "startedAt");

-- CreateIndex
CREATE INDEX "WorkflowRun_leadId_idx" ON "public"."WorkflowRun"("leadId");

-- CreateIndex
CREATE INDEX "WorkflowStepLog_runId_stepIndex_idx" ON "public"."WorkflowStepLog"("runId", "stepIndex");

-- CreateIndex
CREATE INDEX "ScoringRule_workspaceId_isActive_idx" ON "public"."ScoringRule"("workspaceId", "isActive");

-- CreateIndex
CREATE INDEX "ScoringRule_workspaceId_type_idx" ON "public"."ScoringRule"("workspaceId", "type");

-- CreateIndex
CREATE INDEX "ScoreHistory_leadId_createdAt_idx" ON "public"."ScoreHistory"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_workspaceId_score_idx" ON "public"."Lead"("workspaceId", "score");

-- CreateIndex
CREATE INDEX "Segment_workspaceId_type_idx" ON "public"."Segment"("workspaceId", "type");

-- CreateIndex
CREATE INDEX "Workflow_workspaceId_status_idx" ON "public"."Workflow"("workspaceId", "status");

-- AddForeignKey
ALTER TABLE "public"."SegmentMembership" ADD CONSTRAINT "SegmentMembership_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "public"."Segment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SegmentMembership" ADD CONSTRAINT "SegmentMembership_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkflowRun" ADD CONSTRAINT "WorkflowRun_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "public"."Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WorkflowStepLog" ADD CONSTRAINT "WorkflowStepLog_runId_fkey" FOREIGN KEY ("runId") REFERENCES "public"."WorkflowRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScoringRule" ADD CONSTRAINT "ScoringRule_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScoreHistory" ADD CONSTRAINT "ScoreHistory_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScoreHistory" ADD CONSTRAINT "ScoreHistory_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "public"."ScoringRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
