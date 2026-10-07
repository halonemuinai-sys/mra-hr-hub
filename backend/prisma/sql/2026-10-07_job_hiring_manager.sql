-- Hiring Manager per job posting (scopes what a Hiring Manager sees and confirms).
-- Additive only. HR HUB tables live in the `public` schema.
-- Run once:  npx prisma db execute --file prisma/sql/2026-10-07_job_hiring_manager.sql
SET search_path TO public;

-- AlterTable
ALTER TABLE "JobPosting" ADD COLUMN     "hiringManagerId" TEXT;

-- CreateIndex
CREATE INDEX "JobPosting_hiringManagerId_idx" ON "JobPosting"("hiringManagerId");

-- AddForeignKey
ALTER TABLE "JobPosting" ADD CONSTRAINT "JobPosting_hiringManagerId_fkey" FOREIGN KEY ("hiringManagerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

