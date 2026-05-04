-- CreateTable
CREATE TABLE "AIAdjustmentLog" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "responseTimeMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIAdjustmentLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AIAdjustmentLog_recipeId_createdAt_idx" ON "AIAdjustmentLog"("recipeId", "createdAt");

-- AddForeignKey
ALTER TABLE "AIAdjustmentLog" ADD CONSTRAINT "AIAdjustmentLog_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
