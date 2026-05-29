export const appName = "chefitu";

export const RECIPE_TAGS = [
  "Rápido",
  "Fácil",
  "Poucos Ingredientes",
  "Sem Forno",
  "Uma Panela",
  "Vegano",
  "Vegetariano",
  "Sem Glúten",
  "Sem Lactose",
  "Low Carb",
  "Alto Proteico",
  "Assado",
  "Grelhado",
  "Frito",
  "Cru",
  "Fermentado",
  "Fitness",
  "Comfort Food",
  "Infantil",
  "Festa",
  "Marmita",
  "Frango",
  "Carne Vermelha",
  "Peixe",
  "Ovo",
  "Massa",
  "Arroz",
  "Legumes",
  "Chilli"
] as const;

export type RecipeTag = (typeof RECIPE_TAGS)[number];

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
  "Aperitivos",
  "Doces"
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
  instructionsGeneratedByAi: boolean;
  totalTimeMinutes?: number | null;
  servings?: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type ImportRecord = {
  id: string;
  sourcePlatform: "instagram" | "adjusted" | "generated";
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

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AdjustRecipeRequest = {
  sessionId: string;
  messages: ChatMessage[];
};

export type AdjustRecipeResponse =
  | { kind: "message"; message: string }
  | { kind: "adjustment"; adjustedRecipe: RecipeRecord };

export type GeneratedRecipeFields = {
  title: string;
  category?: string | null;
  cuisine?: string | null;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  totalTimeMinutes?: number | null;
  servings?: string | null;
  tags: string[];
};

export type GenerateRecipeRequest = {
  sessionId: string;
  messages: ChatMessage[];
};

export type GenerateRecipeResponse =
  | { kind: "message"; message: string }
  | { kind: "recipe"; recipe: GeneratedRecipeFields };

export type UpdateRecipeRequest = {
  title: string;
  category?: string | null;
  cuisine?: string | null;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  totalTimeMinutes?: number | null;
  servings?: string | null;
  tags: string[];
};

export type CreateAdjustedRecipeRequest = {
  sourceRecipeId: string;
  title: string;
  coverImageUrl?: string | null;
  category?: string | null;
  cuisine?: string | null;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  totalTimeMinutes?: number | null;
  servings?: string | null;
  tags: string[];
};

export type CreateAdjustedRecipeResponse = {
  item: RecipeRecord;
};

export type SaveGeneratedRecipeRequest = GeneratedRecipeFields;

export type SaveGeneratedRecipeResponse = {
  item: RecipeRecord;
};
