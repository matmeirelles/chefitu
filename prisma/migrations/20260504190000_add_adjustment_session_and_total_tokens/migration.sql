-- AlterTable
ALTER TABLE "AIAdjustmentLog"
ADD COLUMN "sessionId" TEXT,
ADD COLUMN "totalTokens" INTEGER;

-- Backfill
UPDATE "AIAdjustmentLog"
SET
  "sessionId" = COALESCE("sessionId", 'legacy:' || "recipeId" || ':' || "id"),
  "totalTokens" = COALESCE("inputTokens", 0) + COALESCE("outputTokens", 0);

-- Make required after backfill
ALTER TABLE "AIAdjustmentLog"
ALTER COLUMN "sessionId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "AIAdjustmentLog_sessionId_createdAt_idx" ON "AIAdjustmentLog"("sessionId", "createdAt");
