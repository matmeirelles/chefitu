-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN "isFavorite" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Recipe" ADD COLUMN "favoritedAt" TIMESTAMP(3);
