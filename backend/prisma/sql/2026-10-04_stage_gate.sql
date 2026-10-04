-- Stage gate: form data on activity log + approval requests (offer above budget, hire confirmation).
-- Additive only. HR HUB tables live in the `public` schema.
-- Run once:  npx prisma db execute --file prisma/sql/2026-10-04_stage_gate.sql
SET search_path TO public;

-- AlterTable
ALTER TABLE "ApplicationActivity" ADD COLUMN     "stageData" JSONB;

-- CreateTable
CREATE TABLE "StageRequest" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "requestedById" TEXT,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "stageData" JSONB,
    "reason" TEXT,
    "approvalPermission" TEXT NOT NULL,
    "approvalReason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decisionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StageRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StageRequest_status_createdAt_idx" ON "StageRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "StageRequest_applicationId_status_idx" ON "StageRequest"("applicationId", "status");

-- AddForeignKey
ALTER TABLE "StageRequest" ADD CONSTRAINT "StageRequest_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageRequest" ADD CONSTRAINT "StageRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageRequest" ADD CONSTRAINT "StageRequest_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

