import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import type { RecipeRecord } from "@my-recipes/shared";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../design-system/tokens";
import { fetchRecipes } from "../services/api";
import { LibraryHeader } from "../components/LibraryHeader";
import { RecipeCard } from "../components/RecipeCard";
import { StateCard } from "../components/StateCard";
import { buildFilterList, filterRecipes } from "../utils/filter";

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

  const filters = useMemo(() => buildFilterList(recipes), [recipes]);

  const filteredRecipes = useMemo(
    () => filterRecipes(recipes, selectedFilter, deferredSearchQuery),
    [recipes, selectedFilter, deferredSearchQuery],
  );

  return (
    <View style={[styles.root, { backgroundColor: COLORS.creme }]}>
      <FlatList
        data={filteredRecipes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RecipeCard recipe={item} onPress={() => onOpenRecipe(item)} />
        )}
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
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void loadRecipes(true)}
            tintColor={COLORS.laranja}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  listContent: {
    paddingBottom: 120,
  },
  separator: { height: 8, marginHorizontal: 16 },
});
