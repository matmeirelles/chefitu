export const appName = "my-recipes";

export type ImportStatus =
  | "queued"
  | "processing"
  | "ready"
  | "no_recipe_in_description"
  | "failed";

export type RecipeIngredient = {
  amount?: string | null;
  unit?: string | null;
  item: string;
};

export type RecipeStep = {
  order: number;
  instruction: string;
};

export type RecipeRecord = {
  id: string;
  importId: string;
  title: string;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  prepTimeMinutes?: number | null;
  cookTimeMinutes?: number | null;
  totalTimeMinutes?: number | null;
  servings?: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type ImportRecord = {
  id: string;
  sourcePlatform: "instagram";
  sourceUrl: string;
  sourceAuthorName?: string | null;
  rawDescription?: string | null;
  coverImageUrl?: string | null;
  status: ImportStatus;
  failureReason?: string | null;
  recipeId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ImportListItem = ImportRecord;

export type ListImportsResponse = {
  items: ImportListItem[];
};

export type ListRecipesResponse = {
  items: RecipeRecord[];
};

export type GetRecipeResponse = {
  item: RecipeRecord;
};
