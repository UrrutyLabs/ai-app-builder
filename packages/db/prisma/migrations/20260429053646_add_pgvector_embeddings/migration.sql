-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "RepoFileEmbedding" (
    "id" TEXT NOT NULL,
    "repoId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RepoFileEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RepoFileEmbedding_repoId_idx" ON "RepoFileEmbedding"("repoId");

-- CreateIndex
CREATE UNIQUE INDEX "RepoFileEmbedding_repoId_path_key" ON "RepoFileEmbedding"("repoId", "path");

-- AddForeignKey
ALTER TABLE "RepoFileEmbedding" ADD CONSTRAINT "RepoFileEmbedding_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "Repo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
