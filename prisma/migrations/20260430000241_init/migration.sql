-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('queued', 'processing', 'ready', 'no_recipe_in_description', 'failed');

-- CreateTable
CREATE TABLE "Import" (
    "id" TEXT NOT NULL,
    "sourcePlatform" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceAuthorName" TEXT,
    "rawDescription" TEXT,
    "coverImageUrl" TEXT,
    "status" "ImportStatus" NOT NULL,
    "failureReason" TEXT,
    "recipeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Import_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "importId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "category" TEXT,
    "cuisine" TEXT,
    "ingredients" JSONB NOT NULL,
    "steps" JSONB NOT NULL,
    "prepTimeMinutes" INTEGER,
    "cookTimeMinutes" INTEGER,
    "totalTimeMinutes" INTEGER,
    "servings" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Import_recipeId_key" ON "Import"("recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_importId_key" ON "Recipe"("importId");

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_importId_fkey" FOREIGN KEY ("importId") REFERENCES "Import"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
