-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "talentaData" JSONB,
ADD COLUMN     "talentaEmployeeId" TEXT,
ADD COLUMN     "talentaError" TEXT,
ADD COLUMN     "talentaMode" TEXT,
ADD COLUMN     "talentaStatus" TEXT,
ADD COLUMN     "talentaSyncedAt" TIMESTAMP(3),
ADD COLUMN     "talentaUserId" INTEGER;

