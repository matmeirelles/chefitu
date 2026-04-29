import type { ImportRecord, RecipeRecord } from "@my-recipes/shared";

export const mockImports: ImportRecord[] = [
  {
    id: "imp_1",
    sourcePlatform: "instagram",
    sourceUrl: "https://www.instagram.com/p/mock-recipe-1/",
    sourceAuthorName: "fitkitchen",
    rawDescription:
      "Pancake recipe: 2 eggs, 1 banana, 2 tbsp oats. Blend everything and cook in a non-stick pan.",
    coverImageUrl: "https://images.example.com/pancake.jpg",
    status: "ready",
    recipeId: "rec_1",
    createdAt: "2026-04-28T18:30:00.000Z",
    updatedAt: "2026-04-28T18:32:00.000Z",
  },
  {
    id: "imp_2",
    sourcePlatform: "instagram",
    sourceUrl: "https://www.instagram.com/p/mock-recipe-2/",
    sourceAuthorName: "sweetweekend",
    status: "processing",
    createdAt: "2026-04-28T18:40:00.000Z",
    updatedAt: "2026-04-28T18:41:00.000Z",
  },
  {
    id: "imp_3",
    sourcePlatform: "instagram",
    sourceUrl: "https://www.instagram.com/p/mock-recipe-3/",
    sourceAuthorName: "quickmeals",
    rawDescription: "So good! Full recipe in the video.",
    status: "no_recipe_in_description",
    failureReason: "No usable recipe found in the description.",
    createdAt: "2026-04-28T18:50:00.000Z",
    updatedAt: "2026-04-28T18:51:00.000Z",
  },
  {
    id: "imp_4",
    sourcePlatform: "instagram",
    sourceUrl: "https://www.instagram.com/p/mock-recipe-4/",
    status: "failed",
    failureReason: "Unable to read the original post description.",
    createdAt: "2026-04-28T19:00:00.000Z",
    updatedAt: "2026-04-28T19:02:00.000Z",
  },
];

export const mockRecipes: RecipeRecord[] = [
  {
    id: "rec_1",
    importId: "imp_1",
    title: "Banana Oat Pancakes",
    ingredients: [
      {
        amount: "2",
        item: "eggs",
      },
      {
        amount: "1",
        item: "banana",
      },
      {
        amount: "2",
        unit: "tbsp",
        item: "oats",
      },
    ],
    steps: [
      {
        order: 1,
        instruction: "Blend all ingredients until smooth.",
      },
      {
        order: 2,
        instruction: "Cook the batter in a non-stick pan over medium heat.",
      },
    ],
    prepTimeMinutes: 5,
    cookTimeMinutes: 10,
    totalTimeMinutes: 15,
    servings: "2 servings",
    tags: ["breakfast", "healthy"],
    createdAt: "2026-04-28T18:32:00.000Z",
    updatedAt: "2026-04-28T18:32:00.000Z",
  },
];
