-- TA ownership (PIC) + activity log for Pipeline Pelamar.
-- Additive only. HR HUB tables live in the `public` schema.
-- Run once:  psql "$DIRECT_URL" -1 -f prisma/sql/2026-10-04_ta_ownership.sql
--   or:      npx prisma db execute --file prisma/sql/2026-10-04_ta_ownership.sql
SET search_path TO public;

-- AlterTable
ALTER TABLE "JobApplication" ADD COLUMN     "assignedAt" TIMESTAMP(3),
ADD COLUMN     "assignedRecruiterId" TEXT,
ADD COLUMN     "stageChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "ApplicationActivity" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "toRecruiterId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApplicationActivity_applicationId_createdAt_idx" ON "ApplicationActivity"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "JobApplication_assignedRecruiterId_idx" ON "JobApplication"("assignedRecruiterId");

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_assignedRecruiterId_fkey" FOREIGN KEY ("assignedRecruiterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationActivity" ADD CONSTRAINT "ApplicationActivity_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationActivity" ADD CONSTRAINT "ApplicationActivity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: treat last update as the moment each application entered its current stage
UPDATE "JobApplication" SET "stageChangedAt" = "updatedAt";
