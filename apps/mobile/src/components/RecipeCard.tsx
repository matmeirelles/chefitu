import type { RecipeRecord } from "@chefitu/shared";
import { DSRecipeCard } from "../design-system/RecipeCard";
import { FALLBACK_COVER_IMAGE } from "../constants";
import { resolveImageUrl } from "../services/api";

export const RecipeCard = ({
  recipe,
  onPress,
}: {
  recipe: RecipeRecord;
  onPress: () => void;
}) => (
  <DSRecipeCard
    title={recipe.title}
    imageUri={resolveImageUrl(recipe.coverImageUrl) ?? FALLBACK_COVER_IMAGE}
    timeLabel={recipe.totalTimeMinutes ? `${recipe.totalTimeMinutes} min` : undefined}
    onPress={onPress}
  />
);
