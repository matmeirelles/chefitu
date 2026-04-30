import test from "node:test";
import assert from "node:assert/strict";
import { getAIProvider } from "./index.js";

test("getAIProvider defaults to anthropic when AI_PROVIDER is not set", () => {
  const previous = process.env.AI_PROVIDER;
  delete process.env.AI_PROVIDER;

  const provider = getAIProvider();

  assert.equal(provider.constructor.name, "AnthropicProvider");

  process.env.AI_PROVIDER = previous;
});

test("getAIProvider returns the ollama provider when configured", () => {
  const previous = process.env.AI_PROVIDER;
  process.env.AI_PROVIDER = "ollama";

  const provider = getAIProvider();

  assert.equal(provider.constructor.name, "OllamaProvider");

  process.env.AI_PROVIDER = previous;
});

test("getAIProvider throws when the provider is unknown", () => {
  const previous = process.env.AI_PROVIDER;
  process.env.AI_PROVIDER = "unknown";

  assert.throws(() => getAIProvider(), /Unknown AI provider/);

  process.env.AI_PROVIDER = previous;
});
