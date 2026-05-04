-- AlterTable
ALTER TABLE "Feature" ADD COLUMN     "prCreatedAt" TIMESTAMP(3),
ADD COLUMN     "prUrl" TEXT;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "planPath" TEXT,
ADD COLUMN     "specPath" TEXT;
