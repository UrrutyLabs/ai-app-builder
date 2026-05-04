-- CreateTable
CREATE TABLE "SpecVersion" (
    "id" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "spec" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpecVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SpecVersion_featureId_createdAt_idx" ON "SpecVersion"("featureId", "createdAt");

-- AddForeignKey
ALTER TABLE "SpecVersion" ADD CONSTRAINT "SpecVersion_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;
