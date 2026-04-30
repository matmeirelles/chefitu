import test, { type TestContext } from "node:test";
import assert from "node:assert/strict";
import { db } from "../../lib/db.js";
import { deleteRecipe, getRecipeById, listRecipes } from "./service.js";

const stubMethod = (
  t: TestContext,
  target: object,
  methodName: string,
  implementation: unknown,
) => {
  const previous = (target as Record<string, unknown>)[methodName];
  (target as Record<string, unknown>)[methodName] = implementation;
  t.after(() => {
    (target as Record<string, unknown>)[methodName] = previous;
  });
};

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
    createdAt: new Date("2026-04-30T10:00:00.000Z"),
    updatedAt: new Date("2026-04-30T10:00:00.000Z"),
  }) as never);

  const item = await getRecipeById("rec_1");

  assert.ok(item);
  assert.equal(item.id, "rec_1");
  assert.equal(item.title, "Banana Oat Pancakes");
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
