-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('PROBATION', 'CONTRACT', 'PERMANENT', 'INTERNSHIP');

-- AlterTable
ALTER TABLE "JobApplication" ADD COLUMN     "releasedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "employeeNo" TEXT NOT NULL,
    "applicationId" TEXT,
    "candidateId" TEXT,
    "jobId" TEXT,
    "fullName" TEXT NOT NULL,
    "personalEmail" TEXT NOT NULL,
    "workEmail" TEXT,
    "phone" TEXT,
    "position" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "division" TEXT NOT NULL,
    "workLocation" TEXT NOT NULL,
    "employmentStatus" "EmploymentStatus" NOT NULL DEFAULT 'PROBATION',
    "joinDate" TIMESTAMP(3) NOT NULL,
    "managerName" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "announcedAt" TIMESTAMP(3),
    "announcedById" TEXT,
    "announcementMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_employeeNo_key" ON "Employee"("employeeNo");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_applicationId_key" ON "Employee"("applicationId");

-- CreateIndex
CREATE INDEX "Employee_announcedAt_idx" ON "Employee"("announcedAt");

-- CreateIndex
CREATE INDEX "Employee_joinDate_idx" ON "Employee"("joinDate");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobPosting"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_announcedById_fkey" FOREIGN KEY ("announcedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

