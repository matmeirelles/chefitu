import type {
  CreateAdjustedRecipeRequest,
  RecipeRecord,
  SaveGeneratedRecipeRequest,
  UpdateRecipeRequest,
} from "@chefitu/shared";
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
  instructionsGeneratedByAi: boolean;
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
  instructionsGeneratedByAi: row.instructionsGeneratedByAi,
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

export const updateRecipe = async (
  recipeId: string,
  data: UpdateRecipeRequest,
): Promise<RecipeRecord | null> => {
  const recipe = await db.recipe.findUnique({ where: { id: recipeId } });
  if (!recipe) return null;

  const updated = await db.recipe.update({
    where: { id: recipeId },
    data: {
      title: data.title,
      category: data.category ?? null,
      cuisine: data.cuisine ?? null,
      ingredients: data.ingredients as never,
      steps: data.steps as never,
      totalTimeMinutes: data.totalTimeMinutes ?? null,
      servings: data.servings ?? null,
      tags: data.tags,
    },
  });

  return toRecipeRecord(updated);
};

export const createAdjustedRecipe = async (
  data: CreateAdjustedRecipeRequest,
): Promise<RecipeRecord> => {
  const sourceRecipe = await db.recipe.findUnique({ where: { id: data.sourceRecipeId } });

  const newImport = await db.import.create({
    data: {
      sourcePlatform: "adjusted",
      sourceUrl: `adjusted:${data.sourceRecipeId}`,
      status: "ready",
    },
  });

  const recipe = await db.recipe.create({
    data: {
      importId: newImport.id,
      title: data.title,
      coverImageUrl: data.coverImageUrl ?? null,
      category: data.category ?? null,
      cuisine: data.cuisine ?? null,
      ingredients: data.ingredients as never,
      steps: data.steps as never,
      instructionsGeneratedByAi: sourceRecipe?.instructionsGeneratedByAi ?? false,
      totalTimeMinutes: data.totalTimeMinutes ?? null,
      servings: data.servings ?? null,
      tags: data.tags,
    },
  });

  await db.import.update({
    where: { id: newImport.id },
    data: { recipeId: recipe.id },
  });

  return toRecipeRecord(recipe);
};

export const createGeneratedRecipe = async (
  data: SaveGeneratedRecipeRequest,
): Promise<RecipeRecord> => {
  const newImport = await db.import.create({
    data: {
      sourcePlatform: "generated",
      sourceUrl: `generated:${Date.now()}`,
      status: "ready",
    },
  });

  const recipe = await db.recipe.create({
    data: {
      importId: newImport.id,
      title: data.title,
      coverImageUrl: null,
      category: data.category ?? null,
      cuisine: data.cuisine ?? null,
      ingredients: data.ingredients as never,
      steps: data.steps as never,
      instructionsGeneratedByAi: true,
      totalTimeMinutes: data.totalTimeMinutes ?? null,
      servings: data.servings ?? null,
      tags: data.tags,
    },
  });

  await db.import.update({
    where: { id: newImport.id },
    data: { recipeId: recipe.id },
  });

  return toRecipeRecord(recipe);
};
