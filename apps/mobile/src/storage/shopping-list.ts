import AsyncStorage from "@react-native-async-storage/async-storage";
import type { RecipeIngredient } from "@chefitu/shared";
import { emojiForIngredient } from "../utils/ingredient-emoji";

export type ShoppingListItem = {
  id: string;
  name: string;
  emoji: string;
  createdAt: string;
};

const STORAGE_KEY = "chefitu.shoppingList.v1";

export const createShoppingListId = (): string =>
  `shop_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

export const loadShoppingList = async (): Promise<ShoppingListItem[]> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeLegacyItem).filter(isShoppingListItem);
  } catch {
    return [];
  }
};

export const saveShoppingList = async (items: ShoppingListItem[]): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export const itemFromIngredient = (ingredient: RecipeIngredient): ShoppingListItem => {
  const name = ingredient.item.trim();
  return {
    id: createShoppingListId(),
    name,
    emoji: emojiForIngredient(name),
    createdAt: new Date().toISOString(),
  };
};

const normalizeLegacyItem = (value: unknown): ShoppingListItem | null => {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const name = typeof row.name === "string" ? row.name.trim() : "";
  if (!name || row.purchased === true) return null;
  const id = typeof row.id === "string" ? row.id : createShoppingListId();
  const createdAt = typeof row.createdAt === "string" ? row.createdAt : new Date().toISOString();
  const emoji =
    typeof row.emoji === "string" && row.emoji
      ? row.emoji
      : emojiForIngredient(name);
  return { id, name, emoji, createdAt };
};

const isShoppingListItem = (value: ShoppingListItem | null): value is ShoppingListItem =>
  value !== null;
