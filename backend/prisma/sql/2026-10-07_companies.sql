-- AlterTable
ALTER TABLE public."JobPosting" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE public."Employee" ADD COLUMN     "companyId" TEXT;

-- CreateTable
CREATE TABLE public."Company" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "npwp" TEXT,
    "address" TEXT,
    "talentaBranch" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_code_key" ON public."Company"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Company_name_key" ON public."Company"("name");

-- CreateIndex
CREATE INDEX "JobPosting_companyId_idx" ON public."JobPosting"("companyId");

-- CreateIndex
CREATE INDEX "Employee_companyId_idx" ON public."Employee"("companyId");

-- AddForeignKey
ALTER TABLE public."JobPosting" ADD CONSTRAINT "JobPosting_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE public."Employee" ADD CONSTRAINT "Employee_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Seed the holding company (more PTs are added from the Companies menu)
INSERT INTO public."Company" ("id", "code", "name", "isActive", "updatedAt")
VALUES (gen_random_uuid()::text, 'MRA', 'PT Mugi Rekso Abadi', true, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;
