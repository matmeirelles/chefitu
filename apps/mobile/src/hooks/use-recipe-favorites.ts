import { useCallback, useState } from "react";
import { Alert } from "react-native";
import type { RecipeRecord } from "@chefitu/shared";
import { setRecipeFavorite } from "../services/api";

type Options = {
  onFavorite?: (recipe: RecipeRecord) => void;
  onUnfavorite?: (recipeId: string) => void;
};

export const useRecipeFavorites = (
  updateRecipeInList: (recipe: RecipeRecord) => void,
  options?: Options,
) => {
  const [pendingUnfavorite, setPendingUnfavorite] = useState<RecipeRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFavoritePress = useCallback(
    (recipe: RecipeRecord) => {
      if (recipe.isFavorite) {
        setPendingUnfavorite(recipe);
        return;
      }

      void (async () => {
        try {
          const updated = await setRecipeFavorite(recipe.id, true);
          updateRecipeInList(updated);
          options?.onFavorite?.(updated);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Não foi possível favoritar a receita.";
          Alert.alert("Ops!", message);
        }
      })();
    },
    [updateRecipeInList, options],
  );

  const cancelUnfavorite = useCallback(() => {
    if (!submitting) setPendingUnfavorite(null);
  }, [submitting]);

  const confirmUnfavorite = useCallback(() => {
    if (!pendingUnfavorite) return;

    void (async () => {
      setSubmitting(true);
      try {
        const updated = await setRecipeFavorite(pendingUnfavorite.id, false);
        options?.onUnfavorite?.(updated.id);
        updateRecipeInList(updated);
        setPendingUnfavorite(null);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Não foi possível atualizar os favoritos.";
        Alert.alert("Ops!", message);
      } finally {
        setSubmitting(false);
      }
    })();
  }, [pendingUnfavorite, updateRecipeInList, options]);

  return {
    pendingUnfavorite,
    unfavoriteSubmitting: submitting,
    handleFavoritePress,
    confirmUnfavorite,
    cancelUnfavorite,
  };
};
