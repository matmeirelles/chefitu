import test from "node:test";
import assert from "node:assert/strict";
import { getAIProvider } from "./index.js";
import { stubEnv } from "../../test/helpers.js";

test("getAIProvider defaults to anthropic when AI_PROVIDER is not set", (t) => {
  stubEnv(t, "AI_PROVIDER", undefined);

  const provider = getAIProvider();

  assert.equal(provider.constructor.name, "AnthropicProvider");
});

test("getAIProvider returns the ollama provider when configured", (t) => {
  stubEnv(t, "AI_PROVIDER", "ollama");

  const provider = getAIProvider();

  assert.equal(provider.constructor.name, "OllamaProvider");
});

test("getAIProvider throws when the provider is unknown", (t) => {
  stubEnv(t, "AI_PROVIDER", "unknown");

  assert.throws(() => getAIProvider(), /Unknown AI provider/);
});
