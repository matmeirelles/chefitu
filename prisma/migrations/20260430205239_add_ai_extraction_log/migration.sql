-- CreateTable
CREATE TABLE "AIExtractionLog" (
    "id" TEXT NOT NULL,
    "importId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "finalResponse" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIExtractionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AIExtractionLog_importId_createdAt_idx" ON "AIExtractionLog"("importId", "createdAt");

-- AddForeignKey
ALTER TABLE "AIExtractionLog" ADD CONSTRAINT "AIExtractionLog_importId_fkey" FOREIGN KEY ("importId") REFERENCES "Import"("id") ON DELETE CASCADE ON UPDATE CASCADE;
