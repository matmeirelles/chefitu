import test from "node:test";
import assert from "node:assert/strict";
import { db } from "../../lib/db.js";
import {
  createGeneratedRecipe,
  deleteRecipe,
  getRecipeById,
  listRecipes,
  setRecipeFavorite,
} from "./service.js";
import { stubMethod } from "../../test/helpers.js";

test("listRecipes maps rows into recipe records", async (t) => {
  stubMethod(t, db.recipe, "findMany", async () => [
    {
      id: "rec_1",
      importId: "imp_1",
      title: "Banana Oat Pancakes",
      coverImageUrl: null,
      category: "Breakfast",
      cuisine: "Healthy",
      ingredients: [{ amount: "2", item: "eggs" }],
      steps: [{ order: 1, instruction: "Mix." }],
      prepTimeMinutes: 5,
      cookTimeMinutes: 10,
      totalTimeMinutes: 15,
      servings: "2 servings",
      tags: ["Quick"],
      instructionsGeneratedByAi: false,
      isFavorite: false,
      favoritedAt: null,
      createdAt: new Date("2026-04-30T10:00:00.000Z"),
      updatedAt: new Date("2026-04-30T10:00:00.000Z"),
    },
  ] as never);

  const items = await listRecipes();

  assert.equal(items.length, 1);
  assert.equal(items[0]!.id, "rec_1");
  assert.equal(items[0]!.category, "Breakfast");
  assert.equal(items[0]!.createdAt, "2026-04-30T10:00:00.000Z");
});

test("getRecipeById returns the mapped recipe when it exists", async (t) => {
  stubMethod(t, db.recipe, "findUnique", async () => ({
    id: "rec_1",
    importId: "imp_1",
    title: "Banana Oat Pancakes",
    coverImageUrl: null,
    category: "Breakfast",
    cuisine: "Healthy",
    ingredients: [{ amount: "2", item: "eggs" }],
    steps: [{ order: 1, instruction: "Mix." }],
    prepTimeMinutes: 5,
    cookTimeMinutes: 10,
    totalTimeMinutes: 15,
    servings: "2 servings",
    tags: ["Quick"],
    instructionsGeneratedByAi: false,
    isFavorite: true,
    favoritedAt: new Date("2026-05-01T12:00:00.000Z"),
    createdAt: new Date("2026-04-30T10:00:00.000Z"),
    updatedAt: new Date("2026-04-30T10:00:00.000Z"),
  }) as never);

  const item = await getRecipeById("rec_1");

  assert.ok(item);
  assert.equal(item.id, "rec_1");
  assert.equal(item.title, "Banana Oat Pancakes");
  assert.equal(item.isFavorite, true);
  assert.equal(item.favoritedAt, "2026-05-01T12:00:00.000Z");
});

test("listRecipes with favoritesOnly filters and orders favorites", async (t) => {
  let findManyArgs: Record<string, unknown> | undefined;

  stubMethod(t, db.recipe, "findMany", async (args: Record<string, unknown>) => {
    findManyArgs = args;
    return [] as never;
  });

  await listRecipes({ favoritesOnly: true });

  assert.deepEqual(findManyArgs, {
    where: { isFavorite: true },
    orderBy: [{ favoritedAt: "desc" }, { createdAt: "desc" }],
  });
});

test("setRecipeFavorite returns null when recipe does not exist", async (t) => {
  stubMethod(t, db.recipe, "findUnique", async () => null as never);

  const item = await setRecipeFavorite("missing", true);

  assert.equal(item, null);
});

test("setRecipeFavorite updates favorite state", async (t) => {
  stubMethod(t, db.recipe, "findUnique", async () => ({ id: "rec_1" }) as never);
  stubMethod(t, db.recipe, "update", async ({ data }: { data: Record<string, unknown> }) => {
    assert.equal(data.isFavorite, true);
    assert.ok(data.favoritedAt instanceof Date);
    return {
      id: "rec_1",
      importId: "imp_1",
      title: "Banana Oat Pancakes",
      coverImageUrl: null,
      category: "Breakfast",
      cuisine: "Healthy",
      ingredients: [],
      steps: [],
      instructionsGeneratedByAi: false,
      totalTimeMinutes: 15,
      servings: "2 servings",
      tags: [],
      isFavorite: data.isFavorite,
      favoritedAt: data.favoritedAt,
      createdAt: new Date("2026-04-30T10:00:00.000Z"),
      updatedAt: new Date("2026-04-30T10:00:00.000Z"),
    } as never;
  });

  const item = await setRecipeFavorite("rec_1", true);

  assert.ok(item);
  assert.equal(item.isFavorite, true);
  assert.ok(item.favoritedAt);
});

test("setRecipeFavorite clears favoritedAt when unfavoriting", async (t) => {
  stubMethod(t, db.recipe, "findUnique", async () => ({ id: "rec_1" }) as never);
  stubMethod(t, db.recipe, "update", async ({ data }: { data: Record<string, unknown> }) => {
    assert.equal(data.isFavorite, false);
    assert.equal(data.favoritedAt, null);
    return {
      id: "rec_1",
      importId: "imp_1",
      title: "Banana Oat Pancakes",
      coverImageUrl: null,
      category: null,
      cuisine: null,
      ingredients: [],
      steps: [],
      instructionsGeneratedByAi: false,
      totalTimeMinutes: null,
      servings: null,
      tags: [],
      isFavorite: false,
      favoritedAt: null,
      createdAt: new Date("2026-04-30T10:00:00.000Z"),
      updatedAt: new Date("2026-04-30T10:00:00.000Z"),
    } as never;
  });

  const item = await setRecipeFavorite("rec_1", false);

  assert.ok(item);
  assert.equal(item.isFavorite, false);
  assert.equal(item.favoritedAt, null);
});

test("getRecipeById returns undefined when the recipe does not exist", async (t) => {
  stubMethod(t, db.recipe, "findUnique", async () => null as never);

  const item = await getRecipeById("missing");

  assert.equal(item, undefined);
});

test("deleteRecipe returns false when the recipe does not exist", async (t) => {
  let recipeDeleteCalled = false;
  let importDeleteCalled = false;

  stubMethod(t, db.recipe, "findUnique", async () => null as never);
  stubMethod(t, db.recipe, "delete", async () => {
    recipeDeleteCalled = true;
    throw new Error("should not be called");
  });
  stubMethod(t, db.import, "delete", async () => {
    importDeleteCalled = true;
    throw new Error("should not be called");
  });

  const result = await deleteRecipe("missing");

  assert.equal(result, false);
  assert.equal(recipeDeleteCalled, false);
  assert.equal(importDeleteCalled, false);
});

test("deleteRecipe deletes the recipe and its source import", async (t) => {
  let deletedRecipeId: string | null = null;
  let deletedImportId: string | null = null;

  stubMethod(
    t,
    db.recipe,
    "findUnique",
    async () => ({ id: "rec_2", importId: "imp_2" }) as never,
  );
  stubMethod(t, db.recipe, "delete", async ({ where }: { where: any }) => {
    deletedRecipeId = where.id;
    return { id: "rec_2" } as never;
  });
  stubMethod(t, db.import, "delete", async ({ where }: { where: any }) => {
    deletedImportId = where.id;
    return { id: "imp_2" } as never;
  });

  const result = await deleteRecipe("rec_2");

  assert.equal(result, true);
  assert.equal(deletedRecipeId, "rec_2");
  assert.equal(deletedImportId, "imp_2");
});

test("createGeneratedRecipe creates a generated import and recipe linked together", async (t) => {
  const originalDateNow = Date.now;
  Date.now = () => 1760000000000;
  t.after(() => {
    Date.now = originalDateNow;
  });

  const createdImports: Array<Record<string, unknown>> = [];
  const createdRecipes: Array<Record<string, unknown>> = [];
  const updatedImports: Array<Record<string, unknown>> = [];

  stubMethod(t, db.import, "create", async ({ data }: { data: Record<string, unknown> }) => {
    createdImports.push(data);
    return {
      id: "imp_generated_1",
      sourceAuthorName: null,
      rawDescription: null,
      coverImageUrl: null,
      failureReason: null,
      recipeId: null,
      createdAt: new Date("2026-05-05T12:00:00.000Z"),
      updatedAt: new Date("2026-05-05T12:00:00.000Z"),
      ...data,
    } as never;
  });

  stubMethod(t, db.recipe, "create", async ({ data }: { data: Record<string, unknown> }) => {
    createdRecipes.push(data);
    return {
      id: "rec_generated_1",
      importId: "imp_generated_1",
      createdAt: new Date("2026-05-05T12:00:01.000Z"),
      updatedAt: new Date("2026-05-05T12:00:01.000Z"),
      ...data,
    } as never;
  });

  stubMethod(t, db.import, "update", async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
    updatedImports.push({ where, data });
    return {
      id: "imp_generated_1",
      recipeId: "rec_generated_1",
      ...data,
    } as never;
  });

  const item = await createGeneratedRecipe({
    title: "Risoto de Cogumelos",
    category: "Almoço",
    cuisine: "Italiana",
    ingredients: [{ amount: "1", unit: "xícara", item: "arroz arbóreo" }],
    steps: [{ order: 1, title: null, instruction: "Refogue a cebola." }],
    totalTimeMinutes: 40,
    servings: "4 porções",
    tags: ["Vegetariano", "Comfort Food"],
  });

  assert.deepEqual(createdImports, [
    {
      sourcePlatform: "generated",
      sourceUrl: "generated:1760000000000",
      status: "ready",
    },
  ]);
  assert.deepEqual(createdRecipes, [
    {
      importId: "imp_generated_1",
      title: "Risoto de Cogumelos",
      coverImageUrl: null,
      category: "Almoço",
      cuisine: "Italiana",
      ingredients: [{ amount: "1", unit: "xícara", item: "arroz arbóreo" }],
      steps: [{ order: 1, title: null, instruction: "Refogue a cebola." }],
      instructionsGeneratedByAi: true,
      totalTimeMinutes: 40,
      servings: "4 porções",
      tags: ["Vegetariano", "Comfort Food"],
    },
  ]);
  assert.deepEqual(updatedImports, [
    {
      where: { id: "imp_generated_1" },
      data: { recipeId: "rec_generated_1" },
    },
  ]);
  assert.equal(item.id, "rec_generated_1");
  assert.equal(item.importId, "imp_generated_1");
  assert.equal(item.instructionsGeneratedByAi, true);
  assert.equal(item.coverImageUrl, null);
});
