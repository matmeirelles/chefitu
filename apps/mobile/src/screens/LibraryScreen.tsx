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
import { ImportProblemPill } from "../components/import/ImportProblemPill";
import { ImportRecipeFlowSheet } from "../components/import/ImportRecipeFlowSheet";
import { useImportFlow } from "../hooks/use-import-flow";
import { useImportQueue } from "../hooks/use-import-queue";

const FAB_SIZE = 56;

export const LibraryScreen = ({
  onOpenRecipe,
}: {
  onOpenRecipe: (recipe: RecipeRecord) => void;
}) => {
  const insets = useSafeAreaInsets();
  const [recipes, setRecipes] = useState<RecipeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");

  const deferredSearchQuery = useDeferredValue(searchQuery);

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

  const importFlow = useImportFlow(() => void loadRecipes(true));

  const { items: problemImports, load: reloadProblems } = useImportQueue(() =>
    void loadRecipes(true),
  );

  const problemItems = useMemo(
    () =>
      problemImports.filter(
        (i) => i.status === "failed" || i.status === "no_recipe_in_description",
      ),
    [problemImports],
  );

  useEffect(() => {
    if (!importFlow.visible) {
      void reloadProblems();
    }
  }, [importFlow.visible, reloadProblems]);

  const filters = useMemo(() => buildFilterList(recipes), [recipes]);

  const filteredRecipes = useMemo(
    () => filterRecipes(recipes, selectedFilter, deferredSearchQuery),
    [recipes, selectedFilter, deferredSearchQuery],
  );

  const gridData = useMemo(
    () => (filteredRecipes.length % 2 !== 0 ? [...filteredRecipes, null] : filteredRecipes),
    [filteredRecipes],
  );

  const fabBottom = SPACING[4];
  const pillBottom = fabBottom + FAB_SIZE + SPACING[3];

  const handleProblemPress = () => {
    const first = problemItems[0];
    if (first) importFlow.openFromProblem(first);
  };

  const handleViewRecipe = (recipe: RecipeRecord) => {
    importFlow.close();
    onOpenRecipe(recipe);
  };

  return (
    <View style={[styles.root, { backgroundColor: COLORS.creme }]}>
      <FlatList
        data={gridData}
        keyExtractor={(item, index) => item?.id ?? `spacer-${index}`}
        numColumns={2}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            {item && <RecipeCard recipe={item} onPress={() => onOpenRecipe(item)} />}
          </View>
        )}
        columnWrapperStyle={styles.columnWrapper}
        ListHeaderComponent={
          <LibraryHeader
            topInset={insets.top}
            searchQuery={searchQuery}
            onChangeSearch={setSearchQuery}
            filters={filters}
            selectedFilter={selectedFilter}
            onSelectFilter={setSelectedFilter}
            recipeCount={filteredRecipes.length}
          />
        }
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

      {!importFlow.visible && (
        <ImportProblemPill
          count={problemItems.length}
          bottomOffset={pillBottom}
          onPress={handleProblemPress}
        />
      )}

      <AddRecipeFab onPress={() => importFlow.open()} bottomOffset={fabBottom} />

      <ImportRecipeFlowSheet
        visible={importFlow.visible}
        phase={importFlow.phase}
        sourceUrl={importFlow.sourceUrl}
        recipe={importFlow.recipe}
        loadingStep={importFlow.loadingStep}
        loadingPercent={importFlow.loadingPercent}
        isSubmitting={importFlow.isSubmitting}
        isActionLoading={importFlow.isActionLoading}
        onClose={importFlow.close}
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
