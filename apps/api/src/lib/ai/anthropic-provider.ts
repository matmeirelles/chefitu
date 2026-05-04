import Anthropic from "@anthropic-ai/sdk";
import type { AIAdjustmentResult, AdjustedRecipeFields, AIExtractionResult, AIProvider, ChatMessage, ExtractedRecipe } from "./types.js";
import { ADJUSTMENT_SYSTEM_PROMPT } from "./adjustmentPrompt.js";
import { EXTRACTION_SYSTEM_PROMPT } from "./extractionPrompt.js";
import { parseAdjustmentResponse } from "./parse-adjustment-response.js";

export class AnthropicProvider implements AIProvider {
  private client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  private model = process.env.AI_MODEL ?? "claude-haiku-4-5-20251001";

  async extractRecipe(description: string): Promise<AIExtractionResult> {
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

    return {
      recipe: JSON.parse(text) as ExtractedRecipe,
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

    return parseAdjustmentResponse(raw, metadata);
  }
}
