-- CreateTable
CREATE TABLE public."OfferLetter" (
    "id" TEXT NOT NULL,
    "letterNo" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "companyId" TEXT,
    "language" TEXT NOT NULL DEFAULT 'id',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "candidateName" TEXT NOT NULL,
    "candidateEmail" TEXT,
    "candidatePhone" TEXT,
    "candidateAddress" TEXT,
    "positionTitle" TEXT NOT NULL,
    "department" TEXT,
    "workLocation" TEXT NOT NULL,
    "employmentType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "baseSalary" DECIMAL(65,30) NOT NULL,
    "allowances" JSONB,
    "benefits" TEXT,
    "probationMonths" INTEGER,
    "contractMonths" INTEGER,
    "workingHours" TEXT,
    "reportingTo" TEXT,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "signatoryName" TEXT NOT NULL,
    "signatoryTitle" TEXT NOT NULL,
    "additionalTerms" TEXT,
    "createdById" TEXT,
    "sentAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "responseNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfferLetter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OfferLetter_letterNo_key" ON public."OfferLetter"("letterNo");

-- CreateIndex
CREATE INDEX "OfferLetter_applicationId_idx" ON public."OfferLetter"("applicationId");

-- CreateIndex
CREATE INDEX "OfferLetter_status_validUntil_idx" ON public."OfferLetter"("status", "validUntil");

-- AddForeignKey
ALTER TABLE public."OfferLetter" ADD CONSTRAINT "OfferLetter_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES public."JobApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE public."OfferLetter" ADD CONSTRAINT "OfferLetter_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE public."OfferLetter" ADD CONSTRAINT "OfferLetter_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

