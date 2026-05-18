import Anthropic from "@anthropic-ai/sdk";
import type {
  AIAdjustmentResult,
  AIGenerationResult,
  AIExtractionResult,
  AIProvider,
  ChatMessage,
  ExtractedRecipe,
} from "./types.js";
import { ADJUSTMENT_SYSTEM_PROMPT } from "./adjustmentPrompt.js";
import { EXTRACTION_SYSTEM_PROMPT } from "./extractionPrompt.js";
import { GENERATION_SYSTEM_PROMPT } from "./generationPrompt.js";
import { parseAdjustmentResponse } from "./parse-adjustment-response.js";
import { parseGenerationResponse } from "./parse-generation-response.js";
import { traceAiGeneration } from "../langfuse/tracing.js";

export class AnthropicProvider implements AIProvider {
  private client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  private model = process.env.AI_MODEL ?? "claude-haiku-4-5-20251001";

  async extractRecipe(description: string): Promise<AIExtractionResult> {
    return traceAiGeneration(
      "anthropic.extract-recipe",
      {
        model: this.model,
        input: {
          system: EXTRACTION_SYSTEM_PROMPT,
          description,
        },
        modelParameters: {
          max_tokens: 2048,
        },
        metadata: {
          provider: "anthropic",
          operation: "extractRecipe",
        },
      },
      async () => {
        const message = await this.client.messages.create({
          model: this.model,
          max_tokens: 2048,
          system: EXTRACTION_SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: `Extract the recipe from this Instagram post:\n\n${description}`,
            },
          ],
        });

        const raw =
          message.content[0]?.type === "text" ? message.content[0].text : "";

        const stripped = raw.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
        const start = stripped.indexOf("{");
        const end = stripped.lastIndexOf("}");
        const text = start !== -1 && end !== -1 ? stripped.slice(start, end + 1) : stripped;

        const result = {
          recipe: JSON.parse(text) as ExtractedRecipe,
          metadata: {
            provider: "anthropic",
            model: this.model,
            inputTokens: message.usage?.input_tokens ?? null,
            outputTokens: message.usage?.output_tokens ?? null,
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
            input_tokens: message.usage?.input_tokens ?? null,
            output_tokens: message.usage?.output_tokens ?? null,
            total_tokens:
              (message.usage?.input_tokens ?? 0) + (message.usage?.output_tokens ?? 0),
          },
        };
      },
    );
  }

  async adjustRecipe(messages: ChatMessage[]): Promise<AIAdjustmentResult> {
    return traceAiGeneration(
      "anthropic.adjust-recipe",
      {
        model: this.model,
        input: {
          system: ADJUSTMENT_SYSTEM_PROMPT,
          messages,
        },
        modelParameters: {
          max_tokens: 4096,
        },
        metadata: {
          provider: "anthropic",
          operation: "adjustRecipe",
        },
      },
      async () => {
        const response = await this.client.messages.create({
          model: this.model,
          max_tokens: 4096,
          system: ADJUSTMENT_SYSTEM_PROMPT,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        });

        const raw =
          response.content[0]?.type === "text" ? response.content[0].text : "";

        const metadata = {
          provider: "anthropic",
          model: this.model,
          inputTokens: response.usage?.input_tokens ?? null,
          outputTokens: response.usage?.output_tokens ?? null,
        };

        const result = parseAdjustmentResponse(raw, metadata);

        return {
          result,
          output: {
            rawResponse: raw,
            parsedResult: result,
          },
          usageDetails: {
            input_tokens: response.usage?.input_tokens ?? null,
            output_tokens: response.usage?.output_tokens ?? null,
            total_tokens:
              (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0),
          },
        };
      },
    );
  }

  async generateRecipe(messages: ChatMessage[]): Promise<AIGenerationResult> {
    return traceAiGeneration(
      "anthropic.generate-recipe",
      {
        model: this.model,
        input: {
          system: GENERATION_SYSTEM_PROMPT,
          messages,
        },
        modelParameters: {
          max_tokens: 4096,
        },
        metadata: {
          provider: "anthropic",
          operation: "generateRecipe",
        },
      },
      async () => {
        const response = await this.client.messages.create({
          model: this.model,
          max_tokens: 4096,
          system: GENERATION_SYSTEM_PROMPT,
          messages: messages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        });

        const raw =
          response.content[0]?.type === "text" ? response.content[0].text : "";

        const metadata = {
          provider: "anthropic",
          model: this.model,
          inputTokens: response.usage?.input_tokens ?? null,
          outputTokens: response.usage?.output_tokens ?? null,
        };

        const result = parseGenerationResponse(raw, metadata);

        return {
          result,
          output: {
            rawResponse: raw,
            parsedResult: result,
          },
          usageDetails: {
            input_tokens: response.usage?.input_tokens ?? null,
            output_tokens: response.usage?.output_tokens ?? null,
            total_tokens:
              (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0),
          },
        };
      },
    );
  }
}
