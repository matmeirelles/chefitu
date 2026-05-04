import test from "node:test";
import assert from "node:assert/strict";
import { parseAdjustmentResponse } from "./parse-adjustment-response.js";

const metadata = {
  provider: "anthropic",
  model: "claude-haiku-4-5",
  inputTokens: 10,
  outputTokens: 20,
};

test("parseAdjustmentResponse returns adjustment for wrapped adjustment JSON", () => {
  const result = parseAdjustmentResponse(
    JSON.stringify({
      type: "adjustment",
      content: {
        title: "Receita ajustada",
        category: "Almoço",
        cuisine: "Brasileira",
        coverImageUrl: null,
        ingredients: [{ amount: "1", unit: "xícara", item: "arroz" }],
        steps: [{ order: 1, title: null, instruction: "Cozinhe." }],
        totalTimeMinutes: 30,
        servings: "2 porções",
        tags: ["Rápido"],
      },
    }),
    metadata,
  );

  assert.equal(result.kind, "adjustment");
  if (result.kind === "adjustment") {
    assert.equal(result.adjustedFields.title, "Receita ajustada");
  }
});

test("parseAdjustmentResponse returns adjustment for raw recipe JSON in markdown fences", () => {
  const result = parseAdjustmentResponse(
    [
      "```json",
      "{",
      '  "title": "Carne Seca Desfiada Cremosa Saudável",',
      '  "category": "Almoço",',
      '  "cuisine": "Brasileira",',
      '  "coverImageUrl": null,',
      '  "ingredients": [{ "amount": "1", "unit": "kg", "item": "Carne seca" }],',
      '  "steps": [{ "order": 1, "title": null, "instruction": "Dessalgue." }],',
      '  "totalTimeMinutes": 60,',
      '  "servings": "4 porções",',
      '  "tags": ["Alto Proteico"]',
      "}",
      "```",
    ].join("\n"),
    metadata,
  );

  assert.equal(result.kind, "adjustment");
  if (result.kind === "adjustment") {
    assert.equal(result.adjustedFields.title, "Carne Seca Desfiada Cremosa Saudável");
  }
});

test("parseAdjustmentResponse returns message for wrapped conversational response", () => {
  const result = parseAdjustmentResponse(
    JSON.stringify({ type: "message", content: "Posso adaptar sem glúten." }),
    metadata,
  );

  assert.equal(result.kind, "message");
  if (result.kind === "message") {
    assert.equal(result.message, "Posso adaptar sem glúten.");
  }
});

test("parseAdjustmentResponse extracts message content when wrapped message JSON is malformed", () => {
  const result = parseAdjustmentResponse(
    `{
      "type": "message",
      "content": "Entendi seu pedido.

1. **Usar claras de ovo**
2. **Reduzir açúcar**"
    }`,
    metadata,
  );

  assert.equal(result.kind, "message");
  if (result.kind === "message") {
    assert.equal(
      result.message,
      "Entendi seu pedido.\n\n1. **Usar claras de ovo**\n2. **Reduzir açúcar**",
    );
  }
});
