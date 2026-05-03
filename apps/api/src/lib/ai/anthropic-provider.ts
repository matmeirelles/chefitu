import Anthropic from "@anthropic-ai/sdk";
import type { AIExtractionResult, AIProvider, ExtractedRecipe } from "./types.js";
import { EXTRACTION_SYSTEM_PROMPT } from "./prompt.js";

export class AnthropicProvider implements AIProvider {
  private client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  private model = process.env.AI_MODEL ?? "claude-haiku-4-5";

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
}
