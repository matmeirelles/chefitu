import type {
  GetRecipeResponse,
  ListImportsResponse,
  ListRecipesResponse,
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
