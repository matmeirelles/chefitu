import test from "node:test";
import assert from "node:assert/strict";
import { db } from "./lib/db.js";
import { buildApp } from "./app.js";
import { aiProviderFactory } from "./lib/ai/index.js";
import { importProcessor } from "./lib/process-import.js";
import { stubMethod } from "./test/helpers.js";

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

test("POST /recipes/generate returns generated recipe payload", async (t) => {
  stubMethod(t, aiProviderFactory, "getAIProvider", () => ({
    extractRecipe: async () => {
      throw new Error("not used in this test");
    },
    adjustRecipe: async () => {
      throw new Error("not used in this test");
    },
    generateRecipe: async () => ({
      kind: "recipe" as const,
      recipe: {
        title: "Risoto de Cogumelos",
        category: "Almoço",
        cuisine: "Italiana",
        ingredients: [{ amount: "1", unit: "xícara", item: "arroz arbóreo" }],
        steps: [{ order: 1, title: null, instruction: "Refogue a cebola." }],
        totalTimeMinutes: 40,
        servings: "4 porções",
        tags: ["Vegetariano", "Comfort Food"],
      },
      metadata: {
        provider: "anthropic",
        model: "claude-haiku-4-5",
        inputTokens: 55,
        outputTokens: 89,
      },
    }),
  }));
  const app = await buildApp();

  const response = await app.inject({
    method: "POST",
    url: "/recipes/generate",
    payload: {
      sessionId: "session_generate_1",
      messages: [{ role: "user", content: "Quero um risoto de cogumelos para 4 pessoas" }],
    },
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), {
    kind: "recipe",
    recipe: {
      title: "Risoto de Cogumelos",
      category: "Almoço",
      cuisine: "Italiana",
      ingredients: [{ amount: "1", unit: "xícara", item: "arroz arbóreo" }],
      steps: [{ order: 1, title: null, instruction: "Refogue a cebola." }],
      totalTimeMinutes: 40,
      servings: "4 porções",
      tags: ["Vegetariano", "Comfort Food"],
    },
  });

  await app.close();
});

test("POST /recipes/generated saves an explicitly generated recipe", async (t) => {
  stubMethod(t, db.import, "create", async () => ({
    id: "imp_generated_1",
    sourcePlatform: "generated",
    sourceUrl: "generated:1760000000000",
    sourceAuthorName: null,
    rawDescription: null,
    coverImageUrl: null,
    status: "ready",
    failureReason: null,
    recipeId: null,
    createdAt: new Date("2026-05-05T12:00:00.000Z"),
    updatedAt: new Date("2026-05-05T12:00:00.000Z"),
  }) as never);
  stubMethod(t, db.recipe, "create", async ({ data }: { data: any }) => ({
    id: "rec_generated_1",
    createdAt: new Date("2026-05-05T12:00:01.000Z"),
    updatedAt: new Date("2026-05-05T12:00:01.000Z"),
    ...data,
  }) as never);
  stubMethod(t, db.import, "update", async () => ({
    id: "imp_generated_1",
    recipeId: "rec_generated_1",
  }) as never);
  const app = await buildApp();

  const response = await app.inject({
    method: "POST",
    url: "/recipes/generated",
    payload: {
      title: "Bolo de Chocolate Simples",
      category: "Sobremesa",
      cuisine: "Outro",
      ingredients: [{ amount: "2", unit: "xícaras", item: "farinha" }],
      steps: [{ order: 1, title: null, instruction: "Misture tudo." }],
      totalTimeMinutes: 50,
      servings: "8 porções",
      tags: ["Fácil", "Assado"],
    },
  });

  assert.equal(response.statusCode, 201);
  const body = response.json() as { item: { id: string; instructionsGeneratedByAi: boolean } };
  assert.equal(body.item.id, "rec_generated_1");
  assert.equal(body.item.instructionsGeneratedByAi, true);

  await app.close();
});

test("POST /recipes/:id/adjust returns the adjusted recipe and persists the adjustment log", async (t) => {
  stubMethod(t, db.recipe, "findUnique", async () => ({
    id: "rec_1",
    importId: "imp_1",
    title: "Banana Oat Pancakes",
    coverImageUrl: null,
    category: "Breakfast",
    cuisine: "Healthy",
    ingredients: [{ amount: "2", unit: null, item: "bananas" }],
    steps: [{ order: 1, instruction: "Mix." }],
    totalTimeMinutes: 15,
    servings: "2 servings",
    tags: ["Quick"],
    createdAt: new Date("2026-04-30T10:00:00.000Z"),
    updatedAt: new Date("2026-04-30T10:00:00.000Z"),
  }) as never);

  stubMethod(t, aiProviderFactory, "getAIProvider", () => ({
    extractRecipe: async () => {
      throw new Error("not used in this test");
    },
    generateRecipe: async () => {
      throw new Error("not used in this test");
    },
    adjustRecipe: async () => ({
      kind: "adjustment" as const,
      adjustedFields: {
        title: "Banana Oat Pancakes Proteicas",
        coverImageUrl: null,
        category: "Breakfast",
        cuisine: "Healthy",
        ingredients: [{ amount: "2", unit: null, item: "bananas" }],
        steps: [{ order: 1, instruction: "Mix." }],
        totalTimeMinutes: 15,
        servings: "2 servings",
        tags: ["Quick"],
      },
      metadata: {
        provider: "anthropic",
        model: "claude-haiku-4-5",
        inputTokens: 111,
        outputTokens: 222,
      },
    }),
  }));

  let createdLog: Record<string, unknown> | undefined;
  stubMethod(t, db.aIAdjustmentLog, "create", async ({ data }: { data: Record<string, unknown> }) => {
    createdLog = data;
    return {
      id: "log_1",
      createdAt: new Date("2026-05-04T15:00:00.000Z"),
      ...data,
    } as never;
  });

  const app = await buildApp();

  const response = await app.inject({
    method: "POST",
    url: "/recipes/rec_1/adjust",
    payload: {
      sessionId: "session_rec_1_abc123",
      messages: [{ role: "user", content: "deixe mais proteica" }],
    },
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(createdLog, {
    sessionId: "session_rec_1_abc123",
    recipeId: "rec_1",
    provider: "anthropic",
    model: "claude-haiku-4-5",
    kind: "adjustment",
    inputTokens: 111,
    outputTokens: 222,
    totalTokens: 333,
    responseTimeMs: createdLog?.responseTimeMs,
  });
  assert.equal(typeof createdLog?.responseTimeMs, "number");

  const body = response.json() as { kind: string; adjustedRecipe: { title: string; id: string } };
  assert.equal(body.kind, "adjustment");
  assert.equal(body.adjustedRecipe.id, "rec_1");
  assert.equal(body.adjustedRecipe.title, "Banana Oat Pancakes Proteicas");

  await app.close();
});

test("POST /recipes/:id/adjust returns 404 when recipe does not exist", async (t) => {
  stubMethod(t, db.recipe, "findUnique", async () => null as never);
  const app = await buildApp();

  const response = await app.inject({
    method: "POST",
    url: "/recipes/missing/adjust",
    payload: {
      sessionId: "session_missing",
      messages: [{ role: "user", content: "reduzir pela metade" }],
    },
  });

  assert.equal(response.statusCode, 404);
  assert.deepEqual(response.json(), { message: "Recipe not found." });

  await app.close();
});

test("POST /recipes/:id/adjust returns AI message response when provider returns kind=message", async (t) => {
  stubMethod(t, db.recipe, "findUnique", async () => ({
    id: "rec_1",
    importId: "imp_1",
    title: "Banana Oat Pancakes",
    coverImageUrl: null,
    category: "Breakfast",
    cuisine: "Healthy",
    ingredients: [{ amount: "2", unit: null, item: "bananas" }],
    steps: [{ order: 1, instruction: "Mix." }],
    totalTimeMinutes: 15,
    servings: "2 servings",
    tags: ["Quick"],
    createdAt: new Date("2026-04-30T10:00:00.000Z"),
    updatedAt: new Date("2026-04-30T10:00:00.000Z"),
  }) as never);
  stubMethod(t, aiProviderFactory, "getAIProvider", () => ({
    extractRecipe: async () => {
      throw new Error("not used in this test");
    },
    generateRecipe: async () => {
      throw new Error("not used in this test");
    },
    adjustRecipe: async () => ({
      kind: "message" as const,
      message: "Posso remover glúten, lactose ou ambos?",
      metadata: {
        provider: "anthropic",
        model: "claude-haiku-4-5",
        inputTokens: 10,
        outputTokens: 8,
      },
    }),
  }));
  stubMethod(t, db.aIAdjustmentLog, "create", async ({ data }: { data: Record<string, unknown> }) => ({
    id: "log_message_1",
    createdAt: new Date("2026-05-04T15:00:00.000Z"),
    ...data,
  }) as never);
  const app = await buildApp();

  const response = await app.inject({
    method: "POST",
    url: "/recipes/rec_1/adjust",
    payload: {
      sessionId: "session_rec_1_message",
      messages: [{ role: "user", content: "não tenho queijo" }],
    },
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), {
    kind: "message",
    message: "Posso remover glúten, lactose ou ambos?",
  });

  await app.close();
});

test("POST /recipes/:id/adjust returns 500 when provider throws", async (t) => {
  stubMethod(t, db.recipe, "findUnique", async () => ({
    id: "rec_1",
    importId: "imp_1",
    title: "Banana Oat Pancakes",
    coverImageUrl: null,
    category: "Breakfast",
    cuisine: "Healthy",
    ingredients: [{ amount: "2", unit: null, item: "bananas" }],
    steps: [{ order: 1, instruction: "Mix." }],
    totalTimeMinutes: 15,
    servings: "2 servings",
    tags: ["Quick"],
    createdAt: new Date("2026-04-30T10:00:00.000Z"),
    updatedAt: new Date("2026-04-30T10:00:00.000Z"),
  }) as never);
  stubMethod(t, aiProviderFactory, "getAIProvider", () => ({
    extractRecipe: async () => {
      throw new Error("not used in this test");
    },
    generateRecipe: async () => {
      throw new Error("not used in this test");
    },
    adjustRecipe: async () => {
      throw new Error("provider timeout");
    },
  }));
  const app = await buildApp();

  const response = await app.inject({
    method: "POST",
    url: "/recipes/rec_1/adjust",
    payload: {
      sessionId: "session_rec_1_error",
      messages: [{ role: "user", content: "reduzir açúcar" }],
    },
  });

  assert.equal(response.statusCode, 500);
  assert.deepEqual(response.json(), {
    message: "AI adjustment failed.",
    detail: "Error: provider timeout",
  });

  await app.close();
});

test("POST /recipes/:id/adjust uses fallback sessionId and still returns adjustment when log persistence fails", async (t) => {
  stubMethod(t, db.recipe, "findUnique", async () => ({
    id: "rec_1",
    importId: "imp_1",
    title: "Banana Oat Pancakes",
    coverImageUrl: "https://img.local/original.jpg",
    category: "Breakfast",
    cuisine: "Healthy",
    ingredients: [{ amount: "2", unit: null, item: "bananas" }],
    steps: [{ order: 1, instruction: "Mix." }],
    totalTimeMinutes: 15,
    servings: "2 servings",
    tags: ["Quick"],
    createdAt: new Date("2026-04-30T10:00:00.000Z"),
    updatedAt: new Date("2026-04-30T10:00:00.000Z"),
  }) as never);
  stubMethod(t, aiProviderFactory, "getAIProvider", () => ({
    extractRecipe: async () => {
      throw new Error("not used in this test");
    },
    generateRecipe: async () => {
      throw new Error("not used in this test");
    },
    adjustRecipe: async () => ({
      kind: "adjustment" as const,
      adjustedFields: {
        title: "Banana Oat Pancakes sem açúcar",
        coverImageUrl: null,
        category: "Breakfast",
        cuisine: "Healthy",
        ingredients: [{ amount: "2", unit: null, item: "bananas" }],
        steps: [{ order: 1, instruction: "Mix." }],
        totalTimeMinutes: 15,
        servings: "2 servings",
        tags: ["Quick"],
      },
      metadata: {
        provider: "anthropic",
        model: "claude-haiku-4-5",
        inputTokens: 90,
        outputTokens: 60,
      },
    }),
  }));

  let capturedSessionId: string | undefined;
  stubMethod(t, db.aIAdjustmentLog, "create", async ({ data }: { data: Record<string, unknown> }) => {
    capturedSessionId = data.sessionId as string;
    throw new Error("db unavailable");
  });
  const app = await buildApp();

  const response = await app.inject({
    method: "POST",
    url: "/recipes/rec_1/adjust",
    payload: {
      sessionId: "   ",
      messages: [{ role: "user", content: "quero menos doce" }],
    },
  });

  assert.equal(response.statusCode, 200);
  assert.ok(capturedSessionId?.startsWith("fallback:rec_1:"));

  const body = response.json() as { kind: string; adjustedRecipe: { coverImageUrl: string | null } };
  assert.equal(body.kind, "adjustment");
  assert.equal(body.adjustedRecipe.coverImageUrl, "https://img.local/original.jpg");

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
