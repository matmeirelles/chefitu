import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import type { RecipeRecord } from "@my-recipes/shared";
import { RECIPE_CATEGORIES } from "@my-recipes/shared";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchRecipes } from "../services/api";
import { LibraryHeader } from "../components/LibraryHeader";
import { RecipeCard } from "../components/RecipeCard";
import { StateCard } from "../components/StateCard";


export const LibraryScreen = ({
  onOpenRecipe,
}: {
  onOpenRecipe: (recipe: RecipeRecord) => void;
}) => {
  const theme = useTheme();
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
        error instanceof Error
          ? error.message
          : "We could not load your recipes right now.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadRecipes();
  }, [loadRecipes]);

  const filters = useMemo(() => {
    const present = new Set(
      recipes.map((r) => r.category).filter((c): c is string => Boolean(c)),
    );
    const ordered = RECIPE_CATEGORIES.filter((c) => present.has(c));
    return ["All", ...ordered];
  }, [recipes]);

  const filteredRecipes = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();

    return recipes.filter((recipe) => {
      const matchesFilter = selectedFilter === "All" || recipe.category === selectedFilter;

      if (!matchesFilter) return false;
      if (!normalizedQuery) return true;

      const haystack = [
        recipe.title,
        recipe.category,
        recipe.cuisine,
        recipe.tags.join(" "),
        recipe.ingredients.map((ingredient) => ingredient.item).join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [deferredSearchQuery, recipes, selectedFilter]);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
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
              title="Loading recipes"
              body="We are preparing your recipe library."
              loading
            />
          ) : errorMessage ? (
            <StateCard
              title="Could not load recipes"
              body={errorMessage}
              actionLabel="Try again"
              onAction={() => void loadRecipes()}
            />
          ) : (
            <StateCard
              title="No recipes found"
              body="Try another search or a different filter."
            />
          )
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void loadRecipes(true)}
            tintColor={theme.colors.primary}
          />
        }
      />

    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
  },
  separator: {
    height: 8,
  },
});
