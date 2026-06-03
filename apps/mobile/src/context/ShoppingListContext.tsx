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

type AddManualInput = {
  name: string;
  quantity?: string;
};

type ShoppingListContextValue = {
  items: ShoppingListItem[];
  ready: boolean;
  addManualItem: (input: AddManualInput) => void;
  addIngredientItem: (ingredient: RecipeIngredient) => void;
  togglePurchased: (id: string) => void;
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
    (input: AddManualInput) => {
      const name = input.name.trim();
      if (!name) return;
      const entry: ShoppingListItem = {
        id: createShoppingListId(),
        name,
        quantity: input.quantity?.trim() ?? "",
        purchased: false,
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

  const togglePurchased = useCallback(
    (id: string) => {
      persist(
        items.map((item) =>
          item.id === id ? { ...item, purchased: !item.purchased } : item,
        ),
      );
    },
    [items, persist],
  );

  const value = useMemo(
    () => ({ items, ready, addManualItem, addIngredientItem, togglePurchased }),
    [items, ready, addManualItem, addIngredientItem, togglePurchased],
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
