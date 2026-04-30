import type { AIExtractionResult, AIProvider, ExtractedRecipe } from "./types.js";
import { EXTRACTION_SYSTEM_PROMPT } from "./prompt.js";

type OllamaGenerateResponse = {
  response?: string;
  prompt_eval_count?: number;
  eval_count?: number;
};

export class OllamaProvider implements AIProvider {
  private model = process.env.AI_MODEL ?? "llama3.1:8b";
  private baseUrl = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";
  private apiKey = process.env.OLLAMA_API_KEY;

  async extractRecipe(description: string): Promise<AIExtractionResult> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: this.model,
        system: EXTRACTION_SYSTEM_PROMPT,
        prompt: `Extract the recipe from this Instagram post:\n\n${description}`,
        stream: false,
        format: "json",
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Ollama request failed (${response.status}): ${body}`);
    }

    const payload = (await response.json()) as OllamaGenerateResponse;
    const raw = payload.response ?? "";

    const text = raw.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

    return {
      recipe: JSON.parse(text) as ExtractedRecipe,
      metadata: {
        provider: "ollama",
        model: this.model,
        inputTokens: payload.prompt_eval_count ?? null,
        outputTokens: payload.eval_count ?? null,
        rawResponse: raw,
      },
    };
  }
}
