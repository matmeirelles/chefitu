import test, { type TestContext } from "node:test";
import assert from "node:assert/strict";
import { db } from "./db.js";
import { processImport } from "./process-import.js";
import { aiProviderFactory } from "./ai/index.js";
import { instagramFetcher } from "./fetch-instagram.js";
import type { AIProvider } from "./ai/types.js";

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

const stubSilentConsole = (t: TestContext) => {
  stubMethod(t, console, "log", () => undefined);
  stubMethod(t, console, "error", () => undefined);
};

test("processImport returns early when the import record does not exist", async (t) => {
  stubSilentConsole(t);

  let updateCalls = 0;
  stubMethod(t, db.import, "findUnique", async () => null as never);
  stubMethod(t, db.import, "update", async () => {
    updateCalls += 1;
    return {} as never;
  });

  await processImport("missing");

  assert.equal(updateCalls, 0);
});

test("processImport marks the import when no description is found", async (t) => {
  stubSilentConsole(t);

  const updateCalls: Array<{ where: any; data: any }> = [];

  stubMethod(t, db.import, "findUnique", async () => ({
    id: "imp_1",
    sourceUrl: "https://instagram.com/p/1",
    rawDescription: null,
    coverImageUrl: null,
  }) as never);
  stubMethod(t, instagramFetcher, "fetchInstagramData", async () => ({
    description: null,
    coverImageUrl: null,
  }));
  stubMethod(t, db.import, "update", async ({ where, data }: { where: any; data: any }) => {
    updateCalls.push({ where, data });
    return {} as never;
  });

  await processImport("imp_1");

  assert.equal(updateCalls.length, 3);
  assert.deepEqual(updateCalls[0], {
    where: { id: "imp_1" },
    data: { status: "processing" },
  });
  assert.deepEqual(updateCalls[1], {
    where: { id: "imp_1" },
    data: { rawDescription: null, coverImageUrl: null },
  });
  assert.deepEqual(updateCalls[2], {
    where: { id: "imp_1" },
    data: {
      status: "no_recipe_in_description",
      failureReason: "No description found in the post.",
    },
  });
});

test("processImport logs usage and marks no_recipe_in_description when AI finds no recipe", async (t) => {
  stubSilentConsole(t);

  const updateCalls: Array<{ where: any; data: any }> = [];
  const aiLogCalls: Array<{ data: any }> = [];

  const provider: AIProvider = {
    extractRecipe: async () => ({
      recipe: { noRecipe: true },
      metadata: {
        provider: "ollama",
        model: "llama3.1:8b",
        inputTokens: 111,
        outputTokens: 22,
        rawResponse: '{"noRecipe":true}',
      },
    }),
  };

  stubMethod(t, db.import, "findUnique", async () => ({
    id: "imp_2",
    sourceUrl: "https://instagram.com/p/2",
    rawDescription: "just a caption without a recipe",
    coverImageUrl: "https://image.example/cover.jpg",
  }) as never);
  stubMethod(t, aiProviderFactory, "getAIProvider", () => provider);
  stubMethod(t, db.import, "update", async ({ where, data }: { where: any; data: any }) => {
    updateCalls.push({ where, data });
    return {} as never;
  });
  stubMethod(t, db.aIExtractionLog, "create", async ({ data }: { data: any }) => {
    aiLogCalls.push({ data });
    return {} as never;
  });

  await processImport("imp_2");

  assert.equal(aiLogCalls.length, 1);
  assert.deepEqual(aiLogCalls[0]!.data, {
    importId: "imp_2",
    description: "https://instagram.com/p/2",
    provider: "ollama",
    model: "llama3.1:8b",
    inputTokens: 111,
    outputTokens: 22,
    finalResponse: { noRecipe: true },
  });
  assert.deepEqual(updateCalls.at(-1), {
    where: { id: "imp_2" },
    data: {
      status: "no_recipe_in_description",
      failureReason: "No recipe found in the post description.",
    },
  });
});

test("processImport saves the recipe, logs usage, and marks the import as ready", async (t) => {
  stubSilentConsole(t);

  const updateCalls: Array<{ where: any; data: any }> = [];
  const aiLogCalls: Array<{ data: any }> = [];
  const recipeCreateCalls: Array<{ data: any }> = [];

  const provider: AIProvider = {
    extractRecipe: async () => ({
      recipe: {
        title: "Garlic Pasta",
        category: "Main",
        cuisine: "Italian",
        ingredients: [{ amount: "200", unit: "g", item: "pasta" }],
        steps: [{ order: 1, instruction: "Cook pasta." }],
        prepTimeMinutes: 5,
        cookTimeMinutes: 10,
        totalTimeMinutes: 15,
        servings: "2 servings",
        tags: ["Quick"],
      },
      metadata: {
        provider: "ollama",
        model: "llama3.1:8b",
        inputTokens: 140,
        outputTokens: 55,
        rawResponse: '{"title":"Garlic Pasta"}',
      },
    }),
  };

  stubMethod(t, db.import, "findUnique", async () => ({
    id: "imp_3",
    sourceUrl: "https://instagram.com/p/3",
    rawDescription: "200g pasta. Cook pasta. Serves 2.",
    coverImageUrl: "https://image.example/pasta.jpg",
  }) as never);
  stubMethod(t, aiProviderFactory, "getAIProvider", () => provider);
  stubMethod(t, db.import, "update", async ({ where, data }: { where: any; data: any }) => {
    updateCalls.push({ where, data });
    return {} as never;
  });
  stubMethod(t, db.aIExtractionLog, "create", async ({ data }: { data: any }) => {
    aiLogCalls.push({ data });
    return {} as never;
  });
  stubMethod(t, db.recipe, "create", async ({ data }: { data: any }) => {
    recipeCreateCalls.push({ data });
    return { id: "rec_3" } as never;
  });

  await processImport("imp_3");

  assert.equal(aiLogCalls.length, 1);
  assert.equal(recipeCreateCalls.length, 1);
  assert.deepEqual(recipeCreateCalls[0]!.data, {
    importId: "imp_3",
    title: "Garlic Pasta",
    coverImageUrl: "https://image.example/pasta.jpg",
    category: "Main",
    cuisine: "Italian",
    ingredients: [{ amount: "200", unit: "g", item: "pasta" }],
    steps: [{ order: 1, instruction: "Cook pasta." }],
    prepTimeMinutes: 5,
    cookTimeMinutes: 10,
    totalTimeMinutes: 15,
    servings: "2 servings",
    tags: ["Quick"],
  });
  assert.deepEqual(updateCalls.at(-1), {
    where: { id: "imp_3" },
    data: { status: "ready", recipeId: "rec_3" },
  });
});

test("processImport marks the import as failed when an unexpected error happens", async (t) => {
  stubSilentConsole(t);

  const updateCalls: Array<{ where: any; data: any }> = [];

  stubMethod(t, db.import, "findUnique", async () => ({
    id: "imp_4",
    sourceUrl: "https://instagram.com/p/4",
    rawDescription: "caption",
    coverImageUrl: null,
  }) as never);
  stubMethod(t, aiProviderFactory, "getAIProvider", () => {
    throw new Error("provider blew up");
  });
  stubMethod(t, db.import, "update", async ({ where, data }: { where: any; data: any }) => {
    updateCalls.push({ where, data });
    return {} as never;
  });

  await processImport("imp_4");

  assert.deepEqual(updateCalls, [
    {
      where: { id: "imp_4" },
      data: { status: "processing" },
    },
    {
      where: { id: "imp_4" },
      data: {
        status: "failed",
        failureReason: "provider blew up",
      },
    },
  ]);
});
