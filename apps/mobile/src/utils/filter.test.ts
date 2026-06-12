import test from "node:test";
import assert from "node:assert/strict";
import { buildCategoryList, filterRecipes, DEFAULT_FILTERS, hasActiveFilters } from "./filter";
import type { RecipeRecord } from "@chefitu/shared";
import type { HomeFilters } from "./filter";

const makeRecipe = (overrides: Partial<RecipeRecord> = {}): RecipeRecord => ({
  id: "rec_1",
  importId: "imp_1",
  title: "Garlic Pasta",
  coverImageUrl: null,
  category: "Almoço",
  cuisine: "Italian",
  ingredients: [{ amount: "200", unit: "g", item: "pasta" }],
  steps: [{ order: 1, instruction: "Cook." }],
  instructionsGeneratedByAi: false,
  totalTimeMinutes: 15,
  servings: "2 servings",
  tags: ["Quick"],
  isFavorite: false,
  favoritedAt: null,
  createdAt: "2026-04-30T10:00:00.000Z",
  updatedAt: "2026-04-30T10:00:00.000Z",
  ...overrides,
});

const noFilters: HomeFilters = DEFAULT_FILTERS;

// ─── filterRecipes ───────────────────────────────────────────────────────────

test("filterRecipes returns all recipes when no filters and query is empty", () => {
  const recipes = [makeRecipe(), makeRecipe({ id: "rec_2", title: "Banana Pancakes" })];

  const result = filterRecipes(recipes, noFilters, "");

  assert.equal(result.length, 2);
});

test("filterRecipes filters by category", () => {
  const recipes = [
    makeRecipe({ id: "rec_1", category: "Almoço" }),
    makeRecipe({ id: "rec_2", category: "Café da manhã" }),
    makeRecipe({ id: "rec_3", category: "Almoço" }),
  ];

  const result = filterRecipes(recipes, { ...noFilters, category: "Café da manhã" }, "");

  assert.equal(result.length, 1);
  assert.equal(result[0]!.id, "rec_2");
});

test("filterRecipes matches recipes by title (case-insensitive)", () => {
  const recipes = [
    makeRecipe({ id: "rec_1", title: "Garlic Pasta", ingredients: [] }),
    makeRecipe({ id: "rec_2", title: "Banana Pancakes", ingredients: [] }),
  ];

  const result = filterRecipes(recipes, noFilters, "pasta");

  assert.equal(result.length, 1);
  assert.equal(result[0]!.id, "rec_1");
});

test("filterRecipes matches recipes by cuisine", () => {
  const recipes = [
    makeRecipe({ id: "rec_1", cuisine: "Italian" }),
    makeRecipe({ id: "rec_2", cuisine: "Brazilian" }),
  ];

  const result = filterRecipes(recipes, noFilters, "Brazilian");

  assert.equal(result.length, 1);
  assert.equal(result[0]!.id, "rec_2");
});

test("filterRecipes matches recipes by tag", () => {
  const recipes = [
    makeRecipe({ id: "rec_1", tags: ["Quick", "Healthy"] }),
    makeRecipe({ id: "rec_2", tags: ["Slow cook"] }),
  ];

  const result = filterRecipes(recipes, noFilters, "healthy");

  assert.equal(result.length, 1);
  assert.equal(result[0]!.id, "rec_1");
});

test("filterRecipes matches recipes by ingredient item", () => {
  const recipes = [
    makeRecipe({ id: "rec_1", title: "Dish A", ingredients: [{ item: "pasta" }, { item: "garlic" }] }),
    makeRecipe({ id: "rec_2", title: "Dish B", ingredients: [{ item: "banana" }, { item: "oats" }] }),
  ];

  const result = filterRecipes(recipes, noFilters, "garlic");

  assert.equal(result.length, 1);
  assert.equal(result[0]!.id, "rec_1");
});

test("filterRecipes combines category filter and search query", () => {
  const recipes = [
    makeRecipe({ id: "rec_1", category: "Almoço", title: "Garlic Pasta" }),
    makeRecipe({ id: "rec_2", category: "Café da manhã", title: "Garlic Toast" }),
    makeRecipe({ id: "rec_3", category: "Almoço", title: "Tomato Soup" }),
  ];

  const result = filterRecipes(recipes, { ...noFilters, category: "Almoço" }, "garlic");

  assert.equal(result.length, 1);
  assert.equal(result[0]!.id, "rec_1");
});

test("filterRecipes ignores leading/trailing whitespace in query", () => {
  const recipes = [makeRecipe({ title: "Garlic Pasta" })];

  const result = filterRecipes(recipes, noFilters, "  pasta  ");

  assert.equal(result.length, 1);
});

test("filterRecipes returns empty array when no recipe matches", () => {
  const recipes = [makeRecipe({ title: "Garlic Pasta" })];

  const result = filterRecipes(recipes, noFilters, "chocolate");

  assert.equal(result.length, 0);
});

// ─── prepTime filter ──────────────────────────────────────────────────────────

test("filterRecipes prepTime 15 excludes recipes with totalTimeMinutes > 15", () => {
  const recipes = [
    makeRecipe({ id: "rec_1", totalTimeMinutes: 10 }),
    makeRecipe({ id: "rec_2", totalTimeMinutes: 15 }),
    makeRecipe({ id: "rec_3", totalTimeMinutes: 20 }),
  ];

  const result = filterRecipes(recipes, { ...noFilters, prepTime: "15" }, "");

  assert.equal(result.length, 2);
  assert.ok(result.some((r) => r.id === "rec_1"));
  assert.ok(result.some((r) => r.id === "rec_2"));
});

test("filterRecipes prepTime 30 excludes recipes with totalTimeMinutes > 30", () => {
  const recipes = [
    makeRecipe({ id: "rec_1", totalTimeMinutes: 25 }),
    makeRecipe({ id: "rec_2", totalTimeMinutes: 30 }),
    makeRecipe({ id: "rec_3", totalTimeMinutes: 45 }),
  ];

  const result = filterRecipes(recipes, { ...noFilters, prepTime: "30" }, "");

  assert.equal(result.length, 2);
  assert.ok(result.every((r) => r.id !== "rec_3"));
});

test("filterRecipes prepTime 60+ includes only recipes with totalTimeMinutes > 60", () => {
  const recipes = [
    makeRecipe({ id: "rec_1", totalTimeMinutes: 45 }),
    makeRecipe({ id: "rec_2", totalTimeMinutes: 60 }),
    makeRecipe({ id: "rec_3", totalTimeMinutes: 90 }),
  ];

  const result = filterRecipes(recipes, { ...noFilters, prepTime: "60+" }, "");

  assert.equal(result.length, 1);
  assert.equal(result[0]!.id, "rec_3");
});

test("filterRecipes excludes recipes with null totalTimeMinutes when prepTime filter is active", () => {
  const recipes = [
    makeRecipe({ id: "rec_1", totalTimeMinutes: 10 }),
    makeRecipe({ id: "rec_2", totalTimeMinutes: null }),
  ];

  const result = filterRecipes(recipes, { ...noFilters, prepTime: "15" }, "");

  assert.equal(result.length, 1);
  assert.equal(result[0]!.id, "rec_1");
});

test("filterRecipes includes recipes with null totalTimeMinutes when no prepTime filter", () => {
  const recipes = [
    makeRecipe({ id: "rec_1", totalTimeMinutes: 10 }),
    makeRecipe({ id: "rec_2", totalTimeMinutes: null }),
  ];

  const result = filterRecipes(recipes, noFilters, "");

  assert.equal(result.length, 2);
});

// ─── onlyFavorites filter ─────────────────────────────────────────────────────

test("filterRecipes onlyFavorites returns only favorite recipes", () => {
  const recipes = [
    makeRecipe({ id: "rec_1", isFavorite: true }),
    makeRecipe({ id: "rec_2", isFavorite: false }),
    makeRecipe({ id: "rec_3", isFavorite: true }),
  ];

  const result = filterRecipes(recipes, { ...noFilters, onlyFavorites: true }, "");

  assert.equal(result.length, 2);
  assert.ok(result.every((r) => r.isFavorite));
});

test("filterRecipes combines onlyFavorites with prepTime and search", () => {
  const recipes = [
    makeRecipe({ id: "rec_1", isFavorite: true, totalTimeMinutes: 10, title: "Quick Salad" }),
    makeRecipe({ id: "rec_2", isFavorite: false, totalTimeMinutes: 10, title: "Quick Toast" }),
    makeRecipe({ id: "rec_3", isFavorite: true, totalTimeMinutes: 45, title: "Quick Stew" }),
  ];

  const result = filterRecipes(
    recipes,
    { prepTime: "15", category: null, onlyFavorites: true },
    "quick",
  );

  assert.equal(result.length, 1);
  assert.equal(result[0]!.id, "rec_1");
});

// ─── hasActiveFilters ─────────────────────────────────────────────────────────

test("hasActiveFilters returns false for DEFAULT_FILTERS", () => {
  assert.equal(hasActiveFilters(DEFAULT_FILTERS), false);
});

test("hasActiveFilters returns true when prepTime is set", () => {
  assert.equal(hasActiveFilters({ ...DEFAULT_FILTERS, prepTime: "15" }), true);
});

test("hasActiveFilters returns true when category is set", () => {
  assert.equal(hasActiveFilters({ ...DEFAULT_FILTERS, category: "Almoço" }), true);
});

test("hasActiveFilters returns true when onlyFavorites is true", () => {
  assert.equal(hasActiveFilters({ ...DEFAULT_FILTERS, onlyFavorites: true }), true);
});

// ─── buildCategoryList ────────────────────────────────────────────────────────

test("buildCategoryList returns empty array for empty recipe list", () => {
  const result = buildCategoryList([]);

  assert.equal(result.length, 0);
});

test("buildCategoryList includes only categories present in the recipes", () => {
  const recipes = [
    makeRecipe({ category: "Almoço" }),
    makeRecipe({ category: "Café da manhã" }),
  ];

  const result = buildCategoryList(recipes);

  assert.ok(result.includes("Almoço"));
  assert.ok(result.includes("Café da manhã"));
});

test("buildCategoryList does not include 'All'", () => {
  const result = buildCategoryList([makeRecipe({ category: "Almoço" })]);

  assert.ok(!result.includes("All"));
});

test("buildCategoryList orders categories by RECIPE_CATEGORIES order", () => {
  const recipes = [
    makeRecipe({ id: "rec_1", category: "Sobremesa" }),
    makeRecipe({ id: "rec_2", category: "Café da manhã" }),
  ];

  const result = buildCategoryList(recipes);

  const cafeDaManhaIndex = result.indexOf("Café da manhã");
  const sobremesaIndex = result.indexOf("Sobremesa");
  assert.ok(
    cafeDaManhaIndex < sobremesaIndex,
    `Café da manhã (${cafeDaManhaIndex}) should come before Sobremesa (${sobremesaIndex})`,
  );
});

test("buildCategoryList deduplicates categories", () => {
  const recipes = [
    makeRecipe({ id: "rec_1", category: "Almoço" }),
    makeRecipe({ id: "rec_2", category: "Almoço" }),
  ];

  const result = buildCategoryList(recipes);

  assert.equal(result.filter((f) => f === "Almoço").length, 1);
});

test("buildCategoryList ignores recipes with null category", () => {
  const recipes = [
    makeRecipe({ id: "rec_1", category: null }),
    makeRecipe({ id: "rec_2", category: "Café da manhã" }),
  ];

  const result = buildCategoryList(recipes);

  assert.ok(!result.includes(null as unknown as string));
  assert.ok(result.includes("Café da manhã"));
});
