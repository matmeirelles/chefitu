import type { RecipeRecord } from "@my-recipes/shared";
import { mockRecipes } from "../../lib/mock-data.js";

export const listRecipes = async (): Promise<RecipeRecord[]> => mockRecipes;

export const getRecipeById = async (
  recipeId: string,
): Promise<RecipeRecord | undefined> =>
  mockRecipes.find((recipe) => recipe.id === recipeId);
