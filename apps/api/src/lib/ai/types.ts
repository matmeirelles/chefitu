import type { RecipeIngredient, RecipeStep } from "@my-recipes/shared";

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
      prepTimeMinutes?: number | null;
      cookTimeMinutes?: number | null;
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

export interface AIProvider {
  extractRecipe(description: string): Promise<AIExtractionResult>;
}
