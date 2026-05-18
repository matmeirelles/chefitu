import test from "node:test";
import assert from "node:assert/strict";
import { parseGenerationResponse } from "./parse-generation-response.js";

const metadata = {
  provider: "anthropic",
  model: "claude-haiku-4-5",
  inputTokens: 12,
  outputTokens: 34,
};

test("parseGenerationResponse returns recipe for wrapped recipe JSON", () => {
  const result = parseGenerationResponse(
    JSON.stringify({
      type: "recipe",
      content: {
        title: "Risoto de Cogumelos",
        category: "Almoço",
        cuisine: "Italiana",
        ingredients: [{ amount: "1", unit: "xícara", item: "arroz arbóreo" }],
        steps: [{ order: 1, title: null, instruction: "Refogue a cebola." }],
        totalTimeMinutes: 40,
        servings: "4 porções",
        tags: ["Vegetariano", "Comfort Food"],
      },
    }),
    metadata,
  );

  assert.equal(result.kind, "recipe");
  if (result.kind === "recipe") {
    assert.equal(result.recipe.title, "Risoto de Cogumelos");
  }
});

test("parseGenerationResponse returns recipe for raw recipe JSON in markdown fences", () => {
  const result = parseGenerationResponse(
    [
      "```json",
      "{",
      '  "title": "Bolo de Chocolate Simples",',
      '  "category": "Sobremesa",',
      '  "cuisine": "Outro",',
      '  "ingredients": [{ "amount": "2", "unit": "xícaras", "item": "farinha" }],',
      '  "steps": [{ "order": 1, "title": null, "instruction": "Misture tudo." }],',
      '  "totalTimeMinutes": 50,',
      '  "servings": "8 porções",',
      '  "tags": ["Fácil", "Assado"]',
      "}",
      "```",
    ].join("\n"),
    metadata,
  );

  assert.equal(result.kind, "recipe");
  if (result.kind === "recipe") {
    assert.equal(result.recipe.title, "Bolo de Chocolate Simples");
  }
});

test("parseGenerationResponse returns message for wrapped conversational response", () => {
  const result = parseGenerationResponse(
    JSON.stringify({
      type: "message",
      content: "Você quer uma versão vegetariana ou com frango?",
    }),
    metadata,
  );

  assert.equal(result.kind, "message");
  if (result.kind === "message") {
    assert.equal(result.message, "Você quer uma versão vegetariana ou com frango?");
  }
});

test("parseGenerationResponse extracts message content when wrapped message JSON is malformed", () => {
  const result = parseGenerationResponse(
    `{
      "type": "message",
      "content": "Posso seguir de dois jeitos:

1. Fazer assado
2. Fazer na frigideira"
    }`,
    metadata,
  );

  assert.equal(result.kind, "message");
  if (result.kind === "message") {
    assert.equal(result.message, "Posso seguir de dois jeitos:\n\n1. Fazer assado\n2. Fazer na frigideira");
  }
});

test("parseGenerationResponse falls back to raw text when response is not valid JSON", () => {
  const result = parseGenerationResponse("Não consegui entender. Me diga o prato principal.", metadata);

  assert.equal(result.kind, "message");
  if (result.kind === "message") {
    assert.equal(result.message, "Não consegui entender. Me diga o prato principal.");
  }
});
