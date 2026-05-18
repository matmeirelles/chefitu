import test from "node:test";
import assert from "node:assert/strict";
import {
  appendUserMessage,
  appendAssistantMessage,
  buildSessionId,
} from "./generate-chat";
import type { GenerateRecipeResponse } from "@my-recipes/shared";

// ─── buildSessionId ───────────────────────────────────────────────────────────

test("buildSessionId returns a non-empty string", () => {
  const id = buildSessionId();
  assert.ok(typeof id === "string" && id.length > 0);
});

test("buildSessionId returns unique values on each call", () => {
  const a = buildSessionId();
  const b = buildSessionId();
  assert.notEqual(a, b);
});

// ─── appendUserMessage ────────────────────────────────────────────────────────

test("appendUserMessage adds a user message to an empty history", () => {
  const result = appendUserMessage([], "Quero um risoto de cogumelos");
  assert.equal(result.length, 1);
  assert.equal(result[0]!.role, "user");
  assert.equal(result[0]!.content, "Quero um risoto de cogumelos");
});

test("appendUserMessage preserves existing history", () => {
  const history = [{ role: "user" as const, content: "Olá" }];
  const result = appendUserMessage(history, "Mais uma mensagem");
  assert.equal(result.length, 2);
  assert.equal(result[0]!.content, "Olá");
  assert.equal(result[1]!.content, "Mais uma mensagem");
});

test("appendUserMessage does not mutate the input array", () => {
  const history = [{ role: "user" as const, content: "Olá" }];
  const original = [...history];
  appendUserMessage(history, "Nova");
  assert.deepEqual(history, original);
});

// ─── appendAssistantMessage ───────────────────────────────────────────────────

test("appendAssistantMessage with message response adds assistant message", () => {
  const response: GenerateRecipeResponse = { kind: "message", message: "Qual proteína você prefere?" };
  const result = appendAssistantMessage([], response);
  assert.equal(result.length, 1);
  assert.equal(result[0]!.role, "assistant");
  assert.equal(result[0]!.content, "Qual proteína você prefere?");
});

test("appendAssistantMessage with recipe response serializes recipe as JSON", () => {
  const recipe = {
    title: "Risoto de Cogumelos",
    category: "Almoço",
    cuisine: "Italiana",
    ingredients: [{ item: "arroz arbóreo", amount: "300", unit: "g" }],
    steps: [{ order: 1, instruction: "Refogue a cebola." }],
    totalTimeMinutes: 40,
    servings: "4 porções",
    tags: ["Vegetariano"],
  };
  const response: GenerateRecipeResponse = { kind: "recipe", recipe };
  const result = appendAssistantMessage([], response);
  assert.equal(result.length, 1);
  assert.equal(result[0]!.role, "assistant");
  assert.deepEqual(JSON.parse(result[0]!.content), recipe);
});

test("appendAssistantMessage preserves existing history", () => {
  const history = [{ role: "user" as const, content: "Quero risoto" }];
  const response: GenerateRecipeResponse = { kind: "message", message: "Certo!" };
  const result = appendAssistantMessage(history, response);
  assert.equal(result.length, 2);
  assert.equal(result[0]!.content, "Quero risoto");
});

test("appendAssistantMessage does not mutate the input array", () => {
  const history = [{ role: "user" as const, content: "Quero risoto" }];
  const original = [...history];
  const response: GenerateRecipeResponse = { kind: "message", message: "Ok!" };
  appendAssistantMessage(history, response);
  assert.deepEqual(history, original);
});
