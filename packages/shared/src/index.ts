export const appName = "my-recipes";

export const RECIPE_CATEGORIES = [
  "Café da manhã",
  "Almoço",
  "Lanche",
  "Sobremesa",
  "Petisco",
  "Snack",
  "Bebida Alcoólica",
  "Drink",
  "Bebida",
  "Condimento"
,  "Outro",
] as const;

export const RECIPE_CUISINES = [
  "Italiana",
  "Asiática",
  "Saudável",
  "Mexicana",
  "Americana",
  "Brasileira",
  "Mediterrânea",
  "Japonesa",
  "Cafeteria",
  "Alemã",
  "Carnes",
  "Outro",
] as const;

export type RecipeCategory = (typeof RECIPE_CATEGORIES)[number];
export type RecipeCuisine = (typeof RECIPE_CUISINES)[number];

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
  title?: string | null;
  instruction: string;
};

export type RecipeRecord = {
  id: string;
  importId: string;
  title: string;
  coverImageUrl?: string | null;
  category?: string | null;
  cuisine?: string | null;
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
