import type { RecipeRecord } from "@my-recipes/shared";
import { RECIPE_CATEGORIES } from "@my-recipes/shared";

export const filterRecipes = (
  recipes: RecipeRecord[],
  selectedFilter: string,
  searchQuery: string,
): RecipeRecord[] => {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return recipes.filter((recipe) => {
    const matchesFilter = selectedFilter === "All" || recipe.category === selectedFilter;
    if (!matchesFilter) return false;
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

export const buildFilterList = (recipes: RecipeRecord[]): string[] => {
  const present = new Set(
    recipes.map((r) => r.category).filter((c): c is string => Boolean(c)),
  );
  const ordered = RECIPE_CATEGORIES.filter((c) => present.has(c));
  return ["All", ...ordered];
};
