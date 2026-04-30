import test, { type TestContext } from "node:test";
import assert from "node:assert/strict";
import { db } from "./lib/db.js";
import { buildApp } from "./app.js";
import { importProcessor } from "./lib/process-import.js";

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

test("GET /health returns ok", async () => {
  const app = await buildApp();

  const response = await app.inject({
    method: "GET",
    url: "/health",
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), {
    status: "ok",
  });

  await app.close();
});

test("GET /imports returns only inbox items", async (t) => {
  stubMethod(t, db.import, "findMany", async () => [
    {
      id: "imp_2",
      sourcePlatform: "instagram",
      sourceUrl: "https://instagram.com/p/2",
      sourceAuthorName: "sweetweekend",
      rawDescription: null,
      coverImageUrl: null,
      status: "processing",
      failureReason: null,
      recipeId: null,
      createdAt: new Date("2026-04-30T10:00:00.000Z"),
      updatedAt: new Date("2026-04-30T10:01:00.000Z"),
    },
    {
      id: "imp_3",
      sourcePlatform: "instagram",
      sourceUrl: "https://instagram.com/p/3",
      sourceAuthorName: null,
      rawDescription: null,
      coverImageUrl: null,
      status: "failed",
      failureReason: "No recipe found.",
      recipeId: null,
      createdAt: new Date("2026-04-30T10:02:00.000Z"),
      updatedAt: new Date("2026-04-30T10:03:00.000Z"),
    },
  ] as never);
  const app = await buildApp();

  const response = await app.inject({
    method: "GET",
    url: "/imports",
  });

  assert.equal(response.statusCode, 200);

  const body = response.json() as {
    items: Array<{ id: string; status: string }>;
  };

  assert.equal(body.items.length, 2);
  assert.deepEqual(
    body.items.map((item) => item.id),
    ["imp_2", "imp_3"],
  );

  await app.close();
});

test("POST /imports returns 400 when sourceUrl is missing", async () => {
  const app = await buildApp();

  const response = await app.inject({
    method: "POST",
    url: "/imports",
    payload: {},
  });

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.json(), {
    message: "sourceUrl is required.",
  });

  await app.close();
});

test("POST /imports creates a queued import", async (t) => {
  const originalSetImmediate = globalThis.setImmediate;
  globalThis.setImmediate = (((callback: (...args: unknown[]) => void, ...args: unknown[]) => {
    callback(...args);
    return 0 as never;
  }) as unknown) as typeof setImmediate;
  t.after(() => {
    globalThis.setImmediate = originalSetImmediate;
  });

  stubMethod(t, db.import, "create", async ({ data }: { data: any }) => ({
    ...data,
    sourceAuthorName: null,
    rawDescription: null,
    coverImageUrl: null,
    failureReason: null,
    recipeId: null,
    createdAt: new Date("2026-04-30T10:00:00.000Z"),
    updatedAt: new Date("2026-04-30T10:00:00.000Z"),
  }) as never);
  stubMethod(t, importProcessor, "processImport", async () => undefined);
  const app = await buildApp();

  const response = await app.inject({
    method: "POST",
    url: "/imports",
    payload: { sourceUrl: "https://instagram.com/p/4" },
  });

  assert.equal(response.statusCode, 201);
  const body = response.json() as { item: { sourceUrl: string; status: string } };
  assert.equal(body.item.sourceUrl, "https://instagram.com/p/4");
  assert.equal(body.item.status, "queued");

  await app.close();
});

test("DELETE /imports returns 404 when the import does not exist", async (t) => {
  stubMethod(t, db.import, "findUnique", async () => null as never);
  const app = await buildApp();

  const response = await app.inject({
    method: "DELETE",
    url: "/imports/missing",
  });

  assert.equal(response.statusCode, 404);
  assert.deepEqual(response.json(), {
    message: "Import not found.",
  });

  await app.close();
});

test("DELETE /imports returns 204 when the import is deleted", async (t) => {
  stubMethod(t, db.import, "findUnique", async () => ({ id: "imp_1" }) as never);
  stubMethod(t, db.import, "delete", async () => ({ id: "imp_1" }) as never);
  const app = await buildApp();

  const response = await app.inject({
    method: "DELETE",
    url: "/imports/imp_1",
  });

  assert.equal(response.statusCode, 204);

  await app.close();
});

test("POST /imports/:id/retry returns 404 when the import does not exist", async (t) => {
  stubMethod(t, db.import, "findUnique", async () => null as never);
  const app = await buildApp();

  const response = await app.inject({
    method: "POST",
    url: "/imports/missing/retry",
  });

  assert.equal(response.statusCode, 404);
  assert.deepEqual(response.json(), {
    message: "Import not found.",
  });

  await app.close();
});

test("POST /imports/:id/retry resets the import", async (t) => {
  const originalSetImmediate = globalThis.setImmediate;
  globalThis.setImmediate = (((callback: (...args: unknown[]) => void, ...args: unknown[]) => {
    callback(...args);
    return 0 as never;
  }) as unknown) as typeof setImmediate;
  t.after(() => {
    globalThis.setImmediate = originalSetImmediate;
  });

  stubMethod(t, db.import, "findUnique", async () => ({ id: "imp_5" }) as never);
  stubMethod(t, db.import, "update", async () => ({
    id: "imp_5",
    sourcePlatform: "instagram",
    sourceUrl: "https://instagram.com/p/5",
    sourceAuthorName: null,
    rawDescription: null,
    coverImageUrl: null,
    status: "queued",
    failureReason: null,
    recipeId: null,
    createdAt: new Date("2026-04-30T10:00:00.000Z"),
    updatedAt: new Date("2026-04-30T10:10:00.000Z"),
  }) as never);
  stubMethod(t, importProcessor, "processImport", async () => undefined);
  const app = await buildApp();

  const response = await app.inject({
    method: "POST",
    url: "/imports/imp_5/retry",
  });

  assert.equal(response.statusCode, 200);
  const body = response.json() as { item: { id: string; status: string } };
  assert.equal(body.item.id, "imp_5");
  assert.equal(body.item.status, "queued");

  await app.close();
});

test("GET /recipes returns the recipe library", async (t) => {
  stubMethod(t, db.recipe, "findMany", async () => [
    {
      id: "rec_1",
      importId: "imp_1",
      title: "Banana Oat Pancakes",
      coverImageUrl: null,
      category: "Breakfast",
      cuisine: "Healthy",
      ingredients: [],
      steps: [],
      prepTimeMinutes: 5,
      cookTimeMinutes: 10,
      totalTimeMinutes: 15,
      servings: "2 servings",
      tags: ["Quick"],
      createdAt: new Date("2026-04-30T10:00:00.000Z"),
      updatedAt: new Date("2026-04-30T10:00:00.000Z"),
    },
  ] as never);
  const app = await buildApp();

  const response = await app.inject({
    method: "GET",
    url: "/recipes",
  });

  assert.equal(response.statusCode, 200);
  const body = response.json() as { items: Array<{ id: string; title: string }> };
  assert.equal(body.items.length, 1);
  assert.equal(body.items[0]!.id, "rec_1");
  assert.equal(body.items[0]!.title, "Banana Oat Pancakes");

  await app.close();
});

test("GET /recipes/:id returns a recipe when it exists", async (t) => {
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
  const app = await buildApp();

  const response = await app.inject({
    method: "GET",
    url: "/recipes/rec_1",
  });

  assert.equal(response.statusCode, 200);
  const body = response.json() as { item: { id: string; title: string } };
  assert.equal(body.item.id, "rec_1");
  assert.equal(body.item.title, "Banana Oat Pancakes");

  await app.close();
});

test("GET /recipes/:id returns 404 when the recipe does not exist", async (t) => {
  stubMethod(t, db.recipe, "findUnique", async () => null as never);
  const app = await buildApp();

  const response = await app.inject({
    method: "GET",
    url: "/recipes/missing",
  });

  assert.equal(response.statusCode, 404);
  assert.deepEqual(response.json(), {
    message: "Recipe not found.",
  });

  await app.close();
});

test("DELETE /recipes returns 404 when the recipe does not exist", async (t) => {
  stubMethod(t, db.recipe, "findUnique", async () => null as never);
  const app = await buildApp();

  const response = await app.inject({
    method: "DELETE",
    url: "/recipes/missing",
  });

  assert.equal(response.statusCode, 404);
  assert.deepEqual(response.json(), {
    message: "Recipe not found.",
  });

  await app.close();
});

test("DELETE /recipes returns 204 when the recipe is deleted", async (t) => {
  stubMethod(
    t,
    db.recipe,
    "findUnique",
    async () => ({ id: "rec_1", importId: "imp_1" }) as never,
  );
  stubMethod(t, db.recipe, "delete", async () => ({ id: "rec_1" }) as never);
  stubMethod(t, db.import, "delete", async () => ({ id: "imp_1" }) as never);
  const app = await buildApp();

  const response = await app.inject({
    method: "DELETE",
    url: "/recipes/rec_1",
  });

  assert.equal(response.statusCode, 204);

  await app.close();
});
