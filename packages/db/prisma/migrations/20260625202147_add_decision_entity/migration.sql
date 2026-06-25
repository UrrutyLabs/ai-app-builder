/*
  Warnings:

  - You are about to drop the column `transcriptContext` on the `Feature` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "DecisionKind" AS ENUM ('DECISION', 'CONSTRAINT', 'OPEN_QUESTION');

-- CreateEnum
CREATE TYPE "DecisionStatus" AS ENUM ('OPEN', 'ACCEPTED', 'SUPERSEDED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DecisionSource" AS ENUM ('TRANSCRIPT', 'CLARIFYING_ANSWER', 'CONTEXT_DOC', 'HUMAN_EDIT', 'AI_PROPOSAL');

-- AlterTable
ALTER TABLE "Feature" DROP COLUMN "transcriptContext";

-- CreateTable
CREATE TABLE "Decision" (
    "id" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "kind" "DecisionKind" NOT NULL,
    "status" "DecisionStatus" NOT NULL,
    "statement" TEXT NOT NULL,
    "rationale" TEXT,
    "sourceType" "DecisionSource" NOT NULL,
    "sourceId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "Decision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Decision_featureId_idx" ON "Decision"("featureId");

-- CreateIndex
CREATE INDEX "Decision_featureId_status_idx" ON "Decision"("featureId", "status");

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;
