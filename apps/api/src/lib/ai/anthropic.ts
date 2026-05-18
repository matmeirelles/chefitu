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
import { parseAdjustmentResponse } from "./parse-adjustment-response.js";
import { EXTRACTION_SYSTEM_PROMPT } from "./extractionPrompt.js";
import { GENERATION_SYSTEM_PROMPT } from "./generationPrompt.js";
import { parseGenerationResponse } from "./parse-generation-response.js";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export class AnthropicProvider implements AIProvider {
  private model = process.env.AI_MODEL ?? "claude-sonnet-4-6";

  async extractRecipe(description: string): Promise<AIExtractionResult> {
    const message = await client.messages.create({
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

    const text = raw.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

    const parsed = JSON.parse(text) as ExtractedRecipe;

    return {
      recipe: parsed,
      metadata: {
        provider: "anthropic",
        model: this.model,
        inputTokens: message.usage?.input_tokens ?? null,
        outputTokens: message.usage?.output_tokens ?? null,
        rawResponse: raw,
      },
    };
  }

  async adjustRecipe(messages: ChatMessage[]): Promise<AIAdjustmentResult> {
    const response = await client.messages.create({
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

    return parseAdjustmentResponse(raw, metadata);
  }

  async generateRecipe(messages: ChatMessage[]): Promise<AIGenerationResult> {
    const response = await client.messages.create({
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

    return parseGenerationResponse(raw, metadata);
  }
}
