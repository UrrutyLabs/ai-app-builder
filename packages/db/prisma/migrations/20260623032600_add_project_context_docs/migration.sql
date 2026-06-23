-- CreateTable
CREATE TABLE "ProjectContextDoc" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "byteLength" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectContextDoc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectContextDocEmbedding" (
    "id" TEXT NOT NULL,
    "docId" TEXT NOT NULL,
    "chunkIx" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectContextDocEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectContextDoc_projectId_idx" ON "ProjectContextDoc"("projectId");

-- CreateIndex
CREATE INDEX "ProjectContextDocEmbedding_docId_idx" ON "ProjectContextDocEmbedding"("docId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectContextDocEmbedding_docId_chunkIx_key" ON "ProjectContextDocEmbedding"("docId", "chunkIx");

-- AddForeignKey
ALTER TABLE "ProjectContextDoc" ADD CONSTRAINT "ProjectContextDoc_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectContextDocEmbedding" ADD CONSTRAINT "ProjectContextDocEmbedding_docId_fkey" FOREIGN KEY ("docId") REFERENCES "ProjectContextDoc"("id") ON DELETE CASCADE ON UPDATE CASCADE;
