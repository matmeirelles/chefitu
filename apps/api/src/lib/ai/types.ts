import type {
  ChatMessage,
  GeneratedRecipeFields,
  RecipeIngredient,
  RecipeStep,
} from "@my-recipes/shared";

export type { ChatMessage };

export type ExtractedRecipe =
  | {
      noRecipe: true;
    }
  | {
      noRecipe?: false;
      title: string;
      category?: string | null;
      categorySuggestion?: string | null;
      cuisine?: string | null;
      cuisineSuggestion?: string | null;
      ingredients: RecipeIngredient[];
      steps: RecipeStep[];
      instructionsGeneratedByAi?: boolean;
      totalTimeMinutes?: number | null;
      servings?: string | null;
      tags: string[];
    };

export type AIExtractionMetadata = {
  provider: string;
  model: string;
  inputTokens?: number | null;
  outputTokens?: number | null;
  rawResponse: string;
};

export type AIExtractionResult = {
  recipe: ExtractedRecipe;
  metadata: AIExtractionMetadata;
};

export type AdjustedRecipeFields = {
  title: string;
  category?: string | null;
  cuisine?: string | null;
  coverImageUrl?: string | null;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  totalTimeMinutes?: number | null;
  servings?: string | null;
  tags: string[];
};

export type AIAdjustmentMetadata = {
  provider: string;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
};

export type AIAdjustmentResult = (
  | { kind: "message"; message: string }
  | { kind: "adjustment"; adjustedFields: AdjustedRecipeFields }
) & { metadata: AIAdjustmentMetadata };

export type { GeneratedRecipeFields };

export type AIGenerationMetadata = {
  provider: string;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
};

export type AIGenerationResult = (
  | { kind: "message"; message: string }
  | { kind: "recipe"; recipe: GeneratedRecipeFields }
) & { metadata: AIGenerationMetadata };

export interface AIProvider {
  extractRecipe(description: string): Promise<AIExtractionResult>;
  adjustRecipe(messages: ChatMessage[]): Promise<AIAdjustmentResult>;
  generateRecipe(messages: ChatMessage[]): Promise<AIGenerationResult>;
}
