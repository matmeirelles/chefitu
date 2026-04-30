import Anthropic from "@anthropic-ai/sdk";
import type { AIProvider, ExtractedRecipe } from "./types.js";
import { EXTRACTION_SYSTEM_PROMPT } from "./prompt.js";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export class AnthropicProvider implements AIProvider {
  private model = process.env.AI_MODEL ?? "claude-sonnet-4-6";

  async extractRecipe(description: string): Promise<ExtractedRecipe> {
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
    return parsed;
  }
}
