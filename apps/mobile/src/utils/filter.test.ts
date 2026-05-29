import test from "node:test";
import assert from "node:assert/strict";
import { buildFilterList, filterRecipes } from "./filter";
import type { RecipeRecord } from "@chefitu/shared";

const makeRecipe = (overrides: Partial<RecipeRecord> = {}): RecipeRecord => ({
  id: "rec_1",
  importId: "imp_1",
  title: "Garlic Pasta",
  coverImageUrl: null,
  category: "Main",
  cuisine: "Italian",
  ingredients: [{ amount: "200", unit: "g", item: "pasta" }],
  steps: [{ order: 1, instruction: "Cook." }],
  instructionsGeneratedByAi: false,
  totalTimeMinutes: 15,
  servings: "2 servings",
  tags: ["Quick"],
  createdAt: "2026-04-30T10:00:00.000Z",
  updatedAt: "2026-04-30T10:00:00.000Z",
  ...overrides,
});

// ─── filterRecipes ───────────────────────────────────────────────────────────

test("filterRecipes returns all recipes when filter is All and query is empty", () => {
  const recipes = [makeRecipe(), makeRecipe({ id: "rec_2", title: "Banana Pancakes" })];

  const result = filterRecipes(recipes, "All", "");

  assert.equal(result.length, 2);
});

test("filterRecipes filters by category when a filter is selected", () => {
  const recipes = [
    makeRecipe({ id: "rec_1", category: "Main" }),
    makeRecipe({ id: "rec_2", category: "Breakfast" }),
    makeRecipe({ id: "rec_3", category: "Main" }),
  ];

  const result = filterRecipes(recipes, "Breakfast", "");

  assert.equal(result.length, 1);
  assert.equal(result[0]!.id, "rec_2");
});

test("filterRecipes matches recipes by title (case-insensitive)", () => {
  const recipes = [
    makeRecipe({ id: "rec_1", title: "Garlic Pasta", ingredients: [] }),
    makeRecipe({ id: "rec_2", title: "Banana Pancakes", ingredients: [] }),
  ];

  const result = filterRecipes(recipes, "All", "pasta");

  assert.equal(result.length, 1);
  assert.equal(result[0]!.id, "rec_1");
});

test("filterRecipes matches recipes by cuisine", () => {
  const recipes = [
    makeRecipe({ id: "rec_1", cuisine: "Italian" }),
    makeRecipe({ id: "rec_2", cuisine: "Brazilian" }),
  ];

  const result = filterRecipes(recipes, "All", "Brazilian");

  assert.equal(result.length, 1);
  assert.equal(result[0]!.id, "rec_2");
});

test("filterRecipes matches recipes by tag", () => {
  const recipes = [
    makeRecipe({ id: "rec_1", tags: ["Quick", "Healthy"] }),
    makeRecipe({ id: "rec_2", tags: ["Slow cook"] }),
  ];

  const result = filterRecipes(recipes, "All", "healthy");

  assert.equal(result.length, 1);
  assert.equal(result[0]!.id, "rec_1");
});

test("filterRecipes matches recipes by ingredient item", () => {
  const recipes = [
    makeRecipe({ id: "rec_1", title: "Dish A", ingredients: [{ item: "pasta" }, { item: "garlic" }] }),
    makeRecipe({ id: "rec_2", title: "Dish B", ingredients: [{ item: "banana" }, { item: "oats" }] }),
  ];

  const result = filterRecipes(recipes, "All", "garlic");

  assert.equal(result.length, 1);
  assert.equal(result[0]!.id, "rec_1");
});

test("filterRecipes combines category filter and search query", () => {
  const recipes = [
    makeRecipe({ id: "rec_1", category: "Main", title: "Garlic Pasta" }),
    makeRecipe({ id: "rec_2", category: "Breakfast", title: "Garlic Toast" }),
    makeRecipe({ id: "rec_3", category: "Main", title: "Tomato Soup" }),
  ];

  const result = filterRecipes(recipes, "Main", "garlic");

  assert.equal(result.length, 1);
  assert.equal(result[0]!.id, "rec_1");
});

test("filterRecipes ignores leading/trailing whitespace in query", () => {
  const recipes = [makeRecipe({ title: "Garlic Pasta" })];

  const result = filterRecipes(recipes, "All", "  pasta  ");

  assert.equal(result.length, 1);
});

test("filterRecipes returns empty array when no recipe matches", () => {
  const recipes = [makeRecipe({ title: "Garlic Pasta" })];

  const result = filterRecipes(recipes, "All", "chocolate");

  assert.equal(result.length, 0);
});

// ─── buildFilterList ─────────────────────────────────────────────────────────

test("buildFilterList always starts with All", () => {
  const result = buildFilterList([]);

  assert.equal(result[0], "All");
});

test("buildFilterList includes only categories present in the recipes", () => {
  const recipes = [
    makeRecipe({ category: "Almoço" }),
    makeRecipe({ category: "Café da manhã" }),
  ];

  const result = buildFilterList(recipes);

  assert.ok(result.includes("Almoço"));
  assert.ok(result.includes("Café da manhã"));
});

test("buildFilterList orders categories by RECIPE_CATEGORIES order", () => {
  // RECIPE_CATEGORIES: ["Café da manhã", "Almoço", ..., "Sobremesa", ...]
  // "Café da manhã" (index 0) comes before "Sobremesa" (index 3)
  const recipes = [
    makeRecipe({ id: "rec_1", category: "Sobremesa" }),
    makeRecipe({ id: "rec_2", category: "Café da manhã" }),
  ];

  const result = buildFilterList(recipes);

  const cafeDaManhaIndex = result.indexOf("Café da manhã");
  const sobremesaIndex = result.indexOf("Sobremesa");
  assert.ok(
    cafeDaManhaIndex < sobremesaIndex,
    `Café da manhã (${cafeDaManhaIndex}) should come before Sobremesa (${sobremesaIndex})`,
  );
});

test("buildFilterList deduplicates categories", () => {
  const recipes = [
    makeRecipe({ id: "rec_1", category: "Almoço" }),
    makeRecipe({ id: "rec_2", category: "Almoço" }),
  ];

  const result = buildFilterList(recipes);

  assert.equal(result.filter((f) => f === "Almoço").length, 1);
});

test("buildFilterList ignores recipes with null category", () => {
  const recipes = [
    makeRecipe({ id: "rec_1", category: null }),
    makeRecipe({ id: "rec_2", category: "Café da manhã" }),
  ];

  const result = buildFilterList(recipes);

  assert.ok(!result.includes(null as unknown as string));
  assert.ok(result.includes("Café da manhã"));
});
