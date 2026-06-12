import type { RecipeRecord } from "@chefitu/shared";
import { RECIPE_CATEGORIES } from "@chefitu/shared";

export type HomeFilters = {
  prepTime: "15" | "30" | "60" | "60+" | null;
  category: string | null;
  onlyFavorites: boolean;
};

export const DEFAULT_FILTERS: HomeFilters = {
  prepTime: null,
  category: null,
  onlyFavorites: false,
};

export const hasActiveFilters = (filters: HomeFilters): boolean =>
  filters.prepTime !== null || filters.category !== null || filters.onlyFavorites;

export const filterRecipes = (
  recipes: RecipeRecord[],
  filters: HomeFilters,
  searchQuery: string,
): RecipeRecord[] => {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return recipes.filter((recipe) => {
    if (filters.onlyFavorites && !recipe.isFavorite) return false;

    if (filters.category !== null && recipe.category !== filters.category) return false;

    if (filters.prepTime !== null) {
      if (recipe.totalTimeMinutes == null) return false;
      const time = recipe.totalTimeMinutes;
      if (filters.prepTime === "15" && time > 15) return false;
      if (filters.prepTime === "30" && time > 30) return false;
      if (filters.prepTime === "60" && time > 60) return false;
      if (filters.prepTime === "60+" && time <= 60) return false;
    }

    if (!normalizedQuery) return true;

    const haystack = [
      recipe.title,
      recipe.category,
      recipe.cuisine,
      recipe.tags.join(" "),
      recipe.ingredients.map((i) => i.item).join(" "),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
};

export const buildCategoryList = (recipes: RecipeRecord[]): string[] => {
  const present = new Set(
    recipes.map((r) => r.category).filter((c): c is string => Boolean(c)),
  );
  return RECIPE_CATEGORIES.filter((c) => present.has(c));
};
