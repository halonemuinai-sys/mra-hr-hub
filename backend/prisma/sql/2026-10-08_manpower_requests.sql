-- CreateTable
CREATE TABLE public."ManpowerRequest" (
    "id" TEXT NOT NULL,
    "requestNo" TEXT NOT NULL,
    "requestedById" TEXT,
    "companyId" TEXT,
    "positionTitle" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "division" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "employmentType" TEXT NOT NULL,
    "headcount" INTEGER NOT NULL DEFAULT 1,
    "reason" TEXT NOT NULL,
    "replacementFor" TEXT,
    "justification" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "targetStartDate" TIMESTAMP(3),
    "salaryMin" DECIMAL(65,30),
    "salaryMax" DECIMAL(65,30),
    "minEducation" TEXT,
    "minExperience" INTEGER,
    "skills" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decisionNote" TEXT,
    "jobId" TEXT,
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManpowerRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ManpowerRequest_requestNo_key" ON public."ManpowerRequest"("requestNo");

-- CreateIndex
CREATE UNIQUE INDEX "ManpowerRequest_jobId_key" ON public."ManpowerRequest"("jobId");

-- CreateIndex
CREATE INDEX "ManpowerRequest_status_createdAt_idx" ON public."ManpowerRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ManpowerRequest_requestedById_idx" ON public."ManpowerRequest"("requestedById");

-- AddForeignKey
ALTER TABLE public."ManpowerRequest" ADD CONSTRAINT "ManpowerRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES public."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE public."ManpowerRequest" ADD CONSTRAINT "ManpowerRequest_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES public."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE public."ManpowerRequest" ADD CONSTRAINT "ManpowerRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE public."ManpowerRequest" ADD CONSTRAINT "ManpowerRequest_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES public."JobPosting"("id") ON DELETE SET NULL ON UPDATE CASCADE;

