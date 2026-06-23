-- AlterTable
ALTER TABLE "Feature" ADD COLUMN     "planStale" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "SpecVersion" ADD COLUMN     "note" TEXT;
