-- CreateEnum
CREATE TYPE "Mode" AS ENUM ('GREENFIELD', 'EXISTING_SYSTEM');

-- CreateEnum
CREATE TYPE "FeatureStatus" AS ENUM ('DRAFT', 'QUESTIONS_GENERATED', 'ANSWERED', 'SPEC_DRAFTED', 'SPEC_APPROVED', 'PLAN_GENERATED');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mode" "Mode" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feature" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "idea" TEXT NOT NULL,
    "status" "FeatureStatus" NOT NULL DEFAULT 'DRAFT',
    "questions" JSONB,
    "answers" JSONB,
    "spec" JSONB,
    "plan" JSONB,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Feature" ADD CONSTRAINT "Feature_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
