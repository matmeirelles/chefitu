import type {
  AIAdjustmentResult,
  AIGenerationResult,
  AIExtractionResult,
  AIProvider,
  ChatMessage,
  ExtractedRecipe,
} from "./types.js";
import { EXTRACTION_SYSTEM_PROMPT } from "./extractionPrompt.js";
import { traceAiGeneration } from "../langfuse/tracing.js";

type OllamaGenerateResponse = {
  response?: string;
  prompt_eval_count?: number;
  eval_count?: number;
};

export class OllamaProvider implements AIProvider {
  private model = process.env.AI_MODEL ?? "llama3.1:8b";
  private baseUrl =
    process.env.OLLAMA_BASE_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:11434";
  private apiKey = process.env.OLLAMA_API_KEY;

  async extractRecipe(description: string): Promise<AIExtractionResult> {
    return traceAiGeneration(
      "ollama.extract-recipe",
      {
        model: this.model,
        input: {
          system: EXTRACTION_SYSTEM_PROMPT,
          description,
        },
        metadata: {
          provider: "ollama",
          operation: "extractRecipe",
          baseUrl: this.baseUrl,
        },
      },
      async () => {
        const response = await fetch(`${this.baseUrl}/api/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(this.apiKey
              ? {
                  Authorization: `Bearer ${this.apiKey}`,
                  "X-Api-Key": this.apiKey,
                }
              : {}),
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

        const result = {
          recipe: JSON.parse(text) as ExtractedRecipe,
          metadata: {
            provider: "ollama",
            model: this.model,
            inputTokens: payload.prompt_eval_count ?? null,
            outputTokens: payload.eval_count ?? null,
            rawResponse: raw,
          },
        };

        return {
          result,
          output: {
            rawResponse: raw,
            parsedResult: result.recipe,
          },
          usageDetails: {
            input_tokens: payload.prompt_eval_count ?? null,
            output_tokens: payload.eval_count ?? null,
            total_tokens: (payload.prompt_eval_count ?? 0) + (payload.eval_count ?? 0),
          },
        };
      },
    );
  }

  async adjustRecipe(_messages: ChatMessage[]): Promise<AIAdjustmentResult> {
    throw new Error("Recipe adjustment is not supported by the Ollama provider.");
  }

  async generateRecipe(_messages: ChatMessage[]): Promise<AIGenerationResult> {
    throw new Error("Recipe generation is not supported by the Ollama provider.");
  }
}
