import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import type { RecipeRecord } from "@chefitu/shared";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, SPACING } from "../design-system/tokens";
import { fetchRecipes } from "../services/api";
import { LibraryHeader } from "../components/LibraryHeader";
import { RecipeCard } from "../components/RecipeCard";
import { StateCard } from "../components/StateCard";
import { buildFilterList, filterRecipes } from "../utils/filter";
import { AddRecipeFab } from "../components/import/AddRecipeFab";
import { ImportRecipeFlowSheet } from "../components/import/ImportRecipeFlowSheet";
import { ImportProgressBanner } from "../components/import/ImportProgressBanner";
import { useImportFlow } from "../hooks/use-import-flow";
import { useProfile } from "../context/ProfileContext";
import { useLocale } from "../i18n/LocaleContext";
import { DEFAULT_PROFILE } from "../storage/profile";
import { ConfirmUnfavoriteBottomSheet } from "../components/ConfirmUnfavoriteBottomSheet";
import { useRecipeFavorites } from "../hooks/use-recipe-favorites";

const FAB_SIZE = 56;

type FavoritePatch = Pick<RecipeRecord, "isFavorite" | "favoritedAt">;

export const LibraryScreen = ({
  onOpenRecipe,
  returnKey = 0,
  favoritePatches = {},
  onRecipeFavoriteChange,
}: {
  onOpenRecipe: (recipe: RecipeRecord) => void;
  /** Bumped when user returns from recipe detail — refreshes the library list. */
  returnKey?: number;
  /** Favorite updates from other tabs/screens applied to the grid without a full refetch. */
  favoritePatches?: Record<string, FavoritePatch>;
  onRecipeFavoriteChange?: (recipe: RecipeRecord) => void;
}) => {
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const { t } = useLocale();
  const displayName = profile.displayName.trim() || DEFAULT_PROFILE.displayName;
  const [recipes, setRecipes] = useState<RecipeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");

  const deferredSearchQuery = useDeferredValue(searchQuery);

  const updateRecipeInList = useCallback((updated: RecipeRecord) => {
    setRecipes((prev) => prev.map((recipe) => (recipe.id === updated.id ? updated : recipe)));
  }, []);

  const {
    pendingUnfavorite,
    unfavoriteSubmitting,
    handleFavoritePress,
    confirmUnfavorite,
    cancelUnfavorite,
  } = useRecipeFavorites(updateRecipeInList, { onRecipeChange: onRecipeFavoriteChange });

  const loadRecipes = useCallback(async (refreshing = false) => {
    if (refreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMessage(null);
    try {
      const response = await fetchRecipes();
      setRecipes(response.items);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível carregar suas receitas.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadRecipes();
  }, [loadRecipes]);

  useEffect(() => {
    void loadRecipes(true);
  }, [returnKey, loadRecipes]);

  const importFlow = useImportFlow(() => void loadRecipes(true));

  const filters = useMemo(() => buildFilterList(recipes), [recipes]);

  const recipesWithPatches = useMemo(
    () =>
      recipes.map((recipe) => {
        const patch = favoritePatches[recipe.id];
        return patch ? { ...recipe, ...patch } : recipe;
      }),
    [recipes, favoritePatches],
  );

  const filteredRecipes = useMemo(
    () => filterRecipes(recipesWithPatches, selectedFilter, deferredSearchQuery),
    [recipesWithPatches, selectedFilter, deferredSearchQuery],
  );

  const gridData = useMemo(
    () => (filteredRecipes.length % 2 !== 0 ? [...filteredRecipes, null] : filteredRecipes),
    [filteredRecipes],
  );

  const fabBottom = SPACING[4];

  const handleViewRecipe = (recipe: RecipeRecord) => {
    importFlow.resetFlow();
    onOpenRecipe(recipe);
  };

  const showImportBanner = importFlow.banner && !importFlow.visible;

  const listHeader = (
    <LibraryHeader
      topInset={insets.top}
      greeting={t.home.greeting(displayName)}
      subtitle={t.home.subtitle}
      searchPlaceholder={t.home.searchPlaceholder}
      yourRecipesTitle={t.home.yourRecipes}
      recipeCountLabel={t.home.recipeCount(filteredRecipes.length)}
      searchQuery={searchQuery}
      onChangeSearch={setSearchQuery}
      filters={filters}
      selectedFilter={selectedFilter}
      onSelectFilter={setSelectedFilter}
      afterTitle={
        showImportBanner && importFlow.banner ? (
          <ImportProgressBanner
            banner={importFlow.banner}
            loadingStep={importFlow.loadingStep}
            loadingPercent={importFlow.loadingPercent}
            onPress={importFlow.openFromBanner}
          />
        ) : undefined
      }
    />
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
        ListEmptyComponent={
          isLoading ? (
            <StateCard
              title="Carregando receitas"
              body="Preparando sua biblioteca."
              loading
            />
          ) : errorMessage ? (
            <StateCard
              title="Não foi possível carregar"
              body={errorMessage}
              actionLabel="Tentar novamente"
              onAction={() => void loadRecipes()}
            />
          ) : (
            <StateCard
              title="Nenhuma receita encontrada"
              body="Tente outra busca ou um filtro diferente."
            />
          )
        }
        ItemSeparatorComponent={() => <View style={styles.rowSeparator} />}
        contentContainerStyle={[styles.listContent, { paddingBottom: fabBottom + FAB_SIZE + SPACING[4] }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void loadRecipes(true)}
            tintColor={COLORS.laranja}
          />
        }
      />

      <AddRecipeFab onPress={() => importFlow.open()} bottomOffset={fabBottom} />

      <ConfirmUnfavoriteBottomSheet
        visible={pendingUnfavorite !== null}
        recipeTitle={pendingUnfavorite?.title ?? ""}
        submitting={unfavoriteSubmitting}
        onConfirm={confirmUnfavorite}
        onCancel={cancelUnfavorite}
      />

      <ImportRecipeFlowSheet
        visible={importFlow.visible}
        phase={importFlow.phase}
        sourceUrl={importFlow.sourceUrl}
        recipe={importFlow.recipe}
        loadingStep={importFlow.loadingStep}
        loadingPercent={importFlow.loadingPercent}
        isSubmitting={importFlow.isSubmitting}
        isActionLoading={importFlow.isActionLoading}
        onClose={importFlow.resetFlow}
        onDismiss={importFlow.dismissSheet}
        onSubmitUrl={(url) => void importFlow.startImport(url)}
        onDiscard={() => void importFlow.discardImport()}
        onRetry={() => void importFlow.retryImportFlow()}
        onViewRecipe={handleViewRecipe}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  listContent: { paddingBottom: 32 },
  columnWrapper: { gap: 12, paddingHorizontal: 16 },
  rowSeparator: { height: 12 },
  cardWrapper: { flex: 1 },
});
