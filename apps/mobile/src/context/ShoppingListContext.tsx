import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { RecipeIngredient } from "@chefitu/shared";
import {
  createShoppingListId,
  itemFromIngredient,
  loadShoppingList,
  saveShoppingList,
  type ShoppingListItem,
} from "../storage/shopping-list";
import { emojiForIngredient } from "../utils/ingredient-emoji";

type ShoppingListContextValue = {
  items: ShoppingListItem[];
  ready: boolean;
  addManualItem: (name: string) => void;
  addIngredientItem: (ingredient: RecipeIngredient) => void;
  removeItem: (id: string) => void;
  clearList: () => void;
};

const ShoppingListContext = createContext<ShoppingListContextValue | null>(null);

export const ShoppingListProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      const loaded = await loadShoppingList();
      setItems(loaded);
      setReady(true);
    })();
  }, []);

  const persist = useCallback((next: ShoppingListItem[]) => {
    setItems(next);
    void saveShoppingList(next);
  }, []);

  const addManualItem = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const entry: ShoppingListItem = {
        id: createShoppingListId(),
        name: trimmed,
        emoji: emojiForIngredient(trimmed),
        createdAt: new Date().toISOString(),
      };
      persist([entry, ...items]);
    },
    [items, persist],
  );

  const addIngredientItem = useCallback(
    (ingredient: RecipeIngredient) => {
      persist([itemFromIngredient(ingredient), ...items]);
    },
    [items, persist],
  );

  const removeItem = useCallback(
    (id: string) => {
      persist(items.filter((item) => item.id !== id));
    },
    [items, persist],
  );

  const clearList = useCallback(() => {
    persist([]);
  }, [persist]);

  const value = useMemo(
    () => ({ items, ready, addManualItem, addIngredientItem, removeItem, clearList }),
    [items, ready, addManualItem, addIngredientItem, removeItem, clearList],
  );

  return (
    <ShoppingListContext.Provider value={value}>{children}</ShoppingListContext.Provider>
  );
};

export const useShoppingList = (): ShoppingListContextValue => {
  const ctx = useContext(ShoppingListContext);
  if (!ctx) throw new Error("useShoppingList must be used within ShoppingListProvider");
  return ctx;
};
