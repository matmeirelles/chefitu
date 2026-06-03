import AsyncStorage from "@react-native-async-storage/async-storage";
import type { RecipeIngredient } from "@chefitu/shared";

export type ShoppingListItem = {
  id: string;
  name: string;
  quantity: string;
  purchased: boolean;
  createdAt: string;
};

const STORAGE_KEY = "chefitu.shoppingList.v1";

export const formatIngredientQuantity = (ingredient: RecipeIngredient): string =>
  [ingredient.amount, ingredient.unit].filter(Boolean).join(" ").trim();

export const createShoppingListId = (): string =>
  `shop_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

export const loadShoppingList = async (): Promise<ShoppingListItem[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isShoppingListItem);
  } catch {
    return [];
  }
};

export const saveShoppingList = async (items: ShoppingListItem[]): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export const itemFromIngredient = (ingredient: RecipeIngredient): ShoppingListItem => ({
  id: createShoppingListId(),
  name: ingredient.item.trim(),
  quantity: formatIngredientQuantity(ingredient),
  purchased: false,
  createdAt: new Date().toISOString(),
});

const isShoppingListItem = (value: unknown): value is ShoppingListItem => {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.quantity === "string" &&
    typeof item.purchased === "boolean" &&
    typeof item.createdAt === "string"
  );
};
