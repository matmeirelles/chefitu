import type { AIProvider } from "./types.js";
import { AnthropicProvider } from "./anthropic.js";
import { OllamaProvider } from "./ollama.js";

export type { AIProvider, ExtractedRecipe } from "./types.js";

const providers: Record<string, () => AIProvider> = {
  anthropic: () => new AnthropicProvider(),
  ollama: () => new OllamaProvider(),
  // openai: () => new OpenAIProvider(),
  // gemini: () => new GeminiProvider(),
};

export const getAIProvider = (): AIProvider => {
  const name = process.env.AI_PROVIDER ?? "anthropic";
  const factory = providers[name];
  if (!factory) throw new Error(`Unknown AI provider: "${name}"`);
  return factory();
};

export const aiProviderFactory = {
  getAIProvider,
};
