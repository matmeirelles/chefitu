import type { RecipeRecord } from "@my-recipes/shared";
import { db } from "../../lib/db.js";

const toRecipeRecord = (row: {
  id: string;
  importId: string;
  title: string;
  coverImageUrl: string | null;
  category: string | null;
  cuisine: string | null;
  ingredients: unknown;
  steps: unknown;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  totalTimeMinutes: number | null;
  servings: string | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}): RecipeRecord => ({
  id: row.id,
  importId: row.importId,
  title: row.title,
  coverImageUrl: row.coverImageUrl,
  category: row.category,
  cuisine: row.cuisine,
  ingredients: row.ingredients as RecipeRecord["ingredients"],
  steps: row.steps as RecipeRecord["steps"],
  prepTimeMinutes: row.prepTimeMinutes,
  cookTimeMinutes: row.cookTimeMinutes,
  totalTimeMinutes: row.totalTimeMinutes,
  servings: row.servings,
  tags: row.tags,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const listRecipes = async (): Promise<RecipeRecord[]> => {
  const rows = await db.recipe.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map(toRecipeRecord);
};

export const getRecipeById = async (
  recipeId: string,
): Promise<RecipeRecord | undefined> => {
  const row = await db.recipe.findUnique({ where: { id: recipeId } });
  return row ? toRecipeRecord(row) : undefined;
};

export const deleteRecipe = async (recipeId: string): Promise<boolean> => {
  const recipe = await db.recipe.findUnique({ where: { id: recipeId } });
  if (!recipe) return false;
  await db.recipe.delete({ where: { id: recipeId } });
  await db.import.delete({ where: { id: recipe.importId } });
  return true;
};
