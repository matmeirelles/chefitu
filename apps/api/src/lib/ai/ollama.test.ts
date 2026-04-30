import test from "node:test";
import assert from "node:assert/strict";
import { OllamaProvider } from "./ollama.js";

test("OllamaProvider parses JSON responses and usage metadata", async (t) => {
  const previousBaseUrl = process.env.OLLAMA_BASE_URL;
  const previousModel = process.env.AI_MODEL;
  process.env.OLLAMA_BASE_URL = "http://127.0.0.1:11434";
  process.env.AI_MODEL = "llama3.1:8b";

  t.mock.method(globalThis, "fetch", async () =>
    new Response(
      JSON.stringify({
        response: JSON.stringify({
          title: "Bolo de cenoura",
          ingredients: [{ amount: "2", unit: "xicaras", item: "farinha" }],
          steps: [{ order: 1, instruction: "Misture tudo." }],
          tags: ["Caseiro"],
        }),
        prompt_eval_count: 123,
        eval_count: 45,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    ),
  );

  const provider = new OllamaProvider();
  const result = await provider.extractRecipe("descricao");

  assert.equal(result.metadata.provider, "ollama");
  assert.equal(result.metadata.model, "llama3.1:8b");
  assert.equal(result.metadata.inputTokens, 123);
  assert.equal(result.metadata.outputTokens, 45);
  assert.equal("noRecipe" in result.recipe, false);
  if (!("noRecipe" in result.recipe)) {
    assert.equal(result.recipe.title, "Bolo de cenoura");
  }

  process.env.OLLAMA_BASE_URL = previousBaseUrl;
  process.env.AI_MODEL = previousModel;
});

test("OllamaProvider throws a descriptive error when the request fails", async (t) => {
  const previousBaseUrl = process.env.OLLAMA_BASE_URL;
  process.env.OLLAMA_BASE_URL = "http://127.0.0.1:11434";

  t.mock.method(globalThis, "fetch", async () =>
    new Response("boom", {
      status: 500,
    }),
  );

  const provider = new OllamaProvider();

  await assert.rejects(
    () => provider.extractRecipe("descricao"),
    /Ollama request failed \(500\): boom/,
  );

  process.env.OLLAMA_BASE_URL = previousBaseUrl;
});
