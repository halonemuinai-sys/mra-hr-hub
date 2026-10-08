-- AlterTable
ALTER TABLE public."Employee" ADD COLUMN     "probationEndDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE public."OnboardingTask" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "templateKey" TEXT,
    "title" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "assigneeId" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "note" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OnboardingTask_employeeId_sortOrder_idx" ON public."OnboardingTask"("employeeId", "sortOrder");

-- CreateIndex
CREATE INDEX "OnboardingTask_status_dueDate_idx" ON public."OnboardingTask"("status", "dueDate");

-- AddForeignKey
ALTER TABLE public."OnboardingTask" ADD CONSTRAINT "OnboardingTask_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE public."OnboardingTask" ADD CONSTRAINT "OnboardingTask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES public."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE public."OnboardingTask" ADD CONSTRAINT "OnboardingTask_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES public."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

