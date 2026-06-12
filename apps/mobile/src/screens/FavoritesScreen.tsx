import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import type { RecipeRecord } from "@chefitu/shared";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONTS, SPACING, TYPE_SCALE } from "../design-system/tokens";
import { DSText } from "../design-system/Text";
import { DSChip } from "../design-system/Chip";
import { DSMascotSticker } from "../design-system/MascotSticker";
import { RecipeCard } from "../components/RecipeCard";
import { StateCard } from "../components/StateCard";
import { ConfirmUnfavoriteBottomSheet } from "../components/ConfirmUnfavoriteBottomSheet";
import { buildCategoryList, filterRecipes, DEFAULT_FILTERS } from "../utils/filter";
import { fetchFavoriteRecipes } from "../services/api";
import { useRecipeFavorites } from "../hooks/use-recipe-favorites";
import { useLocale } from "../i18n/LocaleContext";

export const FavoritesScreen = ({
  refreshKey = 0,
  onOpenRecipe,
  onGoToLibrary,
  onRecipeFavoriteChange,
}: {
  /** Bumped when the Favoritos tab is opened or when returning from recipe detail. */
  refreshKey?: number;
  onOpenRecipe: (recipe: RecipeRecord) => void;
  onGoToLibrary: () => void;
  onRecipeFavoriteChange?: (recipe: RecipeRecord) => void;
}) => {
  const insets = useSafeAreaInsets();
  const { t } = useLocale();
  const [recipes, setRecipes] = useState<RecipeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState("All");

  const updateRecipeInList = useCallback((updated: RecipeRecord) => {
    setRecipes((prev) => {
      if (!updated.isFavorite) {
        return prev.filter((recipe) => recipe.id !== updated.id);
      }
      const exists = prev.some((recipe) => recipe.id === updated.id);
      if (exists) {
        return prev.map((recipe) => (recipe.id === updated.id ? updated : recipe));
      }
      return [updated, ...prev];
    });
  }, []);

  const {
    pendingUnfavorite,
    unfavoriteSubmitting,
    handleFavoritePress,
    confirmUnfavorite,
    cancelUnfavorite,
  } = useRecipeFavorites(updateRecipeInList, {
    onRecipeChange: onRecipeFavoriteChange,
    onUnfavorite: (recipeId) => {
      setRecipes((prev) => prev.filter((recipe) => recipe.id !== recipeId));
    },
  });

  const loadRecipes = useCallback(async (refreshing = false) => {
    if (refreshing) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetchFavoriteRecipes();
      setRecipes(response.items);
    } catch (error) {
      const message = error instanceof Error ? error.message : t.favorites.loadError;
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [t.favorites.loadError]);

  useEffect(() => {
    void loadRecipes(refreshKey > 0);
  }, [loadRecipes, refreshKey]);

  const filters = useMemo(() => ["All", ...buildCategoryList(recipes)], [recipes]);

  const filteredRecipes = useMemo(
    () => filterRecipes(
      recipes,
      { ...DEFAULT_FILTERS, category: selectedFilter === "All" ? null : selectedFilter },
      "",
    ),
    [recipes, selectedFilter],
  );

  const gridData = useMemo(
    () => (filteredRecipes.length % 2 !== 0 ? [...filteredRecipes, null] : filteredRecipes),
    [filteredRecipes],
  );

  const listHeader = (
    <View style={[styles.header, { paddingTop: insets.top + SPACING[5] }]}>
      <DSText style={styles.screenTitle}>{t.favorites.title}</DSText>
      {!isLoading && !errorMessage && recipes.length > 0 && (
        <DSText style={styles.subtitle}>{t.favorites.recipeCount(filteredRecipes.length)}</DSText>
      )}

      {recipes.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {filters.map((item: string) => (
            <DSChip
              key={item}
              label={item}
              active={item === selectedFilter}
              onPress={() => setSelectedFilter(item)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );

  const emptyComponent = isLoading ? (
    <StateCard title={t.favorites.loadingTitle} body={t.favorites.loadingBody} loading />
  ) : errorMessage ? (
    <StateCard
      title="Ops!"
      body={errorMessage}
      actionLabel="Tentar novamente"
      onAction={() => void loadRecipes()}
    />
  ) : (
    <View style={styles.emptyWrap}>
      <DSMascotSticker id="reveal" size={148} />
      <DSText style={styles.emptyTitle}>{t.favorites.emptyTitle}</DSText>
      <DSText style={styles.emptyBody}>{t.favorites.emptyBody}</DSText>
      <Pressable
        onPress={onGoToLibrary}
        style={({ pressed }) => [styles.emptyCta, pressed && styles.emptyCtaPressed]}
      >
        <DSText style={styles.emptyCtaLabel}>{t.favorites.emptyCta}</DSText>
      </Pressable>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: COLORS.creme }]}>
      <FlatList
        data={gridData}
        keyExtractor={(item, index) => item?.id ?? `spacer-${index}`}
        numColumns={2}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            {item && (
              <RecipeCard
                recipe={item}
                onPress={() => onOpenRecipe(item)}
                onFavoritePress={() => handleFavoritePress(item)}
              />
            )}
          </View>
        )}
        columnWrapperStyle={styles.columnWrapper}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={emptyComponent}
        ItemSeparatorComponent={() => <View style={styles.rowSeparator} />}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void loadRecipes(true)}
            tintColor={COLORS.laranja}
          />
        }
      />

      <ConfirmUnfavoriteBottomSheet
        visible={pendingUnfavorite !== null}
        recipeTitle={pendingUnfavorite?.title ?? ""}
        submitting={unfavoriteSubmitting}
        onConfirm={confirmUnfavorite}
        onCancel={cancelUnfavorite}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    gap: SPACING[3],
    paddingHorizontal: SPACING[4],
    paddingBottom: SPACING[4],
  },
  screenTitle: {
    fontFamily: FONTS.displayBold,
    fontWeight: "700",
    fontSize: TYPE_SCALE.h1,
    lineHeight: TYPE_SCALE.h1 * 1.45,
    color: COLORS.marrom,
  },
  subtitle: {
    fontSize: TYPE_SCALE.bodySm,
    lineHeight: TYPE_SCALE.bodySm * 1.5,
    color: COLORS.marromSoft,
  },
  chipsRow: {
    gap: 8,
    paddingRight: 20,
  },
  listContent: { paddingBottom: 32 },
  columnWrapper: { gap: 12, paddingHorizontal: 16 },
  rowSeparator: { height: 12 },
  cardWrapper: { flex: 1 },
  emptyWrap: {
    alignItems: "center",
    paddingHorizontal: SPACING[6],
    paddingTop: SPACING[4],
    paddingBottom: SPACING[10],
    gap: SPACING[3],
  },
  emptyTitle: {
    fontFamily: FONTS.displayBold,
    fontWeight: "700",
    fontSize: TYPE_SCALE.h2,
    lineHeight: TYPE_SCALE.h2 * 1.4,
    color: COLORS.marrom,
    textAlign: "center",
  },
  emptyBody: {
    fontSize: TYPE_SCALE.body,
    lineHeight: TYPE_SCALE.body * 1.5,
    color: COLORS.marromSoft,
    textAlign: "center",
  },
  emptyCta: {
    marginTop: SPACING[2],
    backgroundColor: COLORS.laranja,
    borderRadius: 999,
    paddingHorizontal: SPACING[6],
    paddingVertical: 14,
  },
  emptyCtaPressed: {
    opacity: 0.92,
  },
  emptyCtaLabel: {
    fontFamily: FONTS.uiBold,
    fontWeight: "700",
    fontSize: TYPE_SCALE.body,
    color: COLORS.white,
  },
});
