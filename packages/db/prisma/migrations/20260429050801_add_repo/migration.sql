-- CreateTable
CREATE TABLE "Repo" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "repo" TEXT NOT NULL,
    "defaultBranch" TEXT NOT NULL,
    "encryptedToken" TEXT NOT NULL,
    "fileTree" JSONB,
    "lastIndexedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Repo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Repo_projectId_key" ON "Repo"("projectId");

-- AddForeignKey
ALTER TABLE "Repo" ADD CONSTRAINT "Repo_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
