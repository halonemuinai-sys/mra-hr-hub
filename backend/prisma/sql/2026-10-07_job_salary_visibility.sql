-- Preserve existing public salary ranges. No-range listings have no salary budget.
BEGIN;
ALTER TABLE public."JobPosting"
  ADD COLUMN IF NOT EXISTS "salaryVisibility" TEXT NOT NULL DEFAULT 'PUBLIC';
UPDATE public."JobPosting" SET "salaryVisibility" = 'UNSPECIFIED'
  WHERE "salaryMin" IS NULL AND "salaryMax" IS NULL AND "salaryVisibility" = 'PUBLIC';
COMMIT;
