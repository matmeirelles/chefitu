import type { ChatMessage, GenerateRecipeResponse } from "@my-recipes/shared";

export const buildSessionId = (): string =>
  `gen_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

export const appendUserMessage = (
  history: ChatMessage[],
  text: string,
): ChatMessage[] => [...history, { role: "user", content: text }];

export const appendAssistantMessage = (
  history: ChatMessage[],
  response: GenerateRecipeResponse,
): ChatMessage[] => [
  ...history,
  {
    role: "assistant",
    content:
      response.kind === "message" ? response.message : JSON.stringify(response.recipe),
  },
];
