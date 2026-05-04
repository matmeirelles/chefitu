import type {
  AdjustRecipeRequest,
  AdjustRecipeResponse,
  ChatMessage,
  CreateAdjustedRecipeRequest,
  CreateAdjustedRecipeResponse,
  GetRecipeResponse,
  ListImportsResponse,
  ListRecipesResponse,
  RecipeRecord,
  UpdateRecipeRequest,
} from "@my-recipes/shared";

const baseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://127.0.0.1:3333";

export class ApiError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message);
    this.name = "ApiError";
  }
}

const request = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${baseUrl}${path}`);

  if (!response.ok) {
    let message = "Unexpected API error.";

    try {
      const body = (await response.json()) as { message?: string };

      if (body.message) {
        message = body.message;
      }
    } catch {
      message = "Unexpected API error.";
    }

    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
};

export const fetchImports = async (): Promise<ListImportsResponse> =>
  request<ListImportsResponse>("/imports");

export const createImport = async (sourceUrl: string): Promise<void> => {
  const response = await fetch(`${baseUrl}/imports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sourceUrl }),
  });
  if (!response.ok) throw new ApiError("Failed to create import.", response.status);
};

export const deleteImport = async (importId: string): Promise<void> => {
  const response = await fetch(`${baseUrl}/imports/${importId}`, { method: "DELETE" });
  if (!response.ok) throw new ApiError("Failed to delete import.", response.status);
};

export const retryImport = async (importId: string): Promise<void> => {
  const response = await fetch(`${baseUrl}/imports/${importId}/retry`, {
    method: "POST",
  });
  if (!response.ok) throw new ApiError("Failed to retry import.", response.status);
};

export const fetchRecipes = async (): Promise<ListRecipesResponse> =>
  request<ListRecipesResponse>("/recipes");

export const fetchRecipeById = async (
  recipeId: string,
): Promise<GetRecipeResponse> => request<GetRecipeResponse>(`/recipes/${recipeId}`);

export const deleteRecipe = async (recipeId: string): Promise<void> => {
  const response = await fetch(`${baseUrl}/recipes/${recipeId}`, { method: "DELETE" });
  if (!response.ok) throw new ApiError("Failed to delete recipe.", response.status);
};

export const adjustRecipe = async (
  recipeId: string,
  sessionId: string,
  messages: ChatMessage[],
): Promise<AdjustRecipeResponse> => {
  const body: AdjustRecipeRequest = { sessionId, messages };
  const response = await fetch(`${baseUrl}/recipes/${recipeId}/adjust`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const json = (await response.json()) as { message?: string; detail?: string };
      detail = [json.message, json.detail].filter(Boolean).join(" — ") || detail;
    } catch {}
    throw new ApiError(detail, response.status);
  }
  return (await response.json()) as AdjustRecipeResponse;
};

export const updateRecipe = async (
  recipeId: string,
  data: UpdateRecipeRequest,
): Promise<RecipeRecord> => {
  const response = await fetch(`${baseUrl}/recipes/${recipeId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new ApiError("Failed to update recipe.", response.status);
  const json = (await response.json()) as { item: RecipeRecord };
  return json.item;
};

export const saveNewRecipe = async (
  data: CreateAdjustedRecipeRequest,
): Promise<RecipeRecord> => {
  const response = await fetch(`${baseUrl}/recipes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new ApiError("Failed to save recipe.", response.status);
  const json = (await response.json()) as CreateAdjustedRecipeResponse;
  return json.item;
};
