import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ChatMessage, RecipeRecord } from "@chefitu/shared";
import { COLORS } from "./design-system/index";
import { DSBottomNav, type BottomNavTab } from "./design-system/BottomNav";
import { LibraryScreen } from "./screens/LibraryScreen";
import { RecipeDetailScreen } from "./screens/RecipeDetailScreen";
import { ShoppingListScreen } from "./screens/ShoppingListScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { FavoritesScreen } from "./screens/FavoritesScreen";
import { GenerateRecipeScreen } from "./screens/GenerateRecipeScreen";
import { useLocale } from "./i18n/LocaleContext";
import type { UIMessage } from "./screens/GenerateRecipeScreen";
import { buildSessionId } from "./utils/generate-chat";

type ScreenState = { kind: "library" } | { kind: "detail"; recipe: RecipeRecord };

type FavoritePatch = Pick<RecipeRecord, "isFavorite" | "favoritedAt">;

export const AppShell = () => {
  const insets = useSafeAreaInsets();
  const { t } = useLocale();
  const navLabels = {
    library: t.nav.library,
    favorites: t.nav.favorites,
    create: t.nav.create,
    list: t.nav.list,
    profile: t.nav.profile,
  };
  const [activeTab, setActiveTab] = useState<BottomNavTab>("library");
  const [screenState, setScreenState] = useState<ScreenState>({ kind: "library" });
  const [librarySeed, setLibrarySeed] = useState(0);
  const [libraryReturnKey, setLibraryReturnKey] = useState(0);
  const [favoritesRefreshKey, setFavoritesRefreshKey] = useState(0);
  const [favoritePatches, setFavoritePatches] = useState<Record<string, FavoritePatch>>({});

  const onRecipeFavoriteChange = useCallback((updated: RecipeRecord) => {
    setFavoritePatches((prev) => ({
      ...prev,
      [updated.id]: {
        isFavorite: updated.isFavorite,
        favoritedAt: updated.favoritedAt ?? null,
      },
    }));
    setScreenState((prev) =>
      prev.kind === "detail" && prev.recipe.id === updated.id
        ? { kind: "detail", recipe: { ...prev.recipe, ...updated } }
        : prev,
    );
  }, []);

  const [generateApiHistory, setGenerateApiHistory] = useState<ChatMessage[]>([]);
  const [generateUiMessages, setGenerateUiMessages] = useState<UIMessage[]>([]);
  const [generateSessionId, setGenerateSessionId] = useState(() => buildSessionId());

  const onDetailOpen = (recipe: RecipeRecord) => setScreenState({ kind: "detail", recipe });
  const onDetailClose = () => {
    setScreenState({ kind: "library" });
    if (activeTab === "library") {
      setLibraryReturnKey((k) => k + 1);
    }
    if (activeTab === "favorites") {
      setFavoritesRefreshKey((k) => k + 1);
    }
  };

  const handleTabPress = (tab: BottomNavTab) => {
    setActiveTab(tab);
    if (tab === "favorites") {
      setFavoritesRefreshKey((k) => k + 1);
    }
  };

  const onRecipeSaved = () => {
    setLibrarySeed((s) => s + 1);
    setActiveTab("library");
  };

  const onSessionReset = () => setGenerateSessionId(buildSessionId());

  const onGoToShoppingList = useCallback(() => {
    setScreenState({ kind: "library" });
    setActiveTab("list");
  }, []);

  const isDetail =
    (activeTab === "library" || activeTab === "favorites") && screenState.kind === "detail";

  return (
    <View style={[styles.root, { backgroundColor: COLORS.creme }]}>
      <View style={styles.content}>
        {/* LibraryScreen: always mounted, hidden only when showing detail */}
        <View style={[styles.screen, (activeTab !== "library" || isDetail) && styles.hidden]}>
          <LibraryScreen
            key={librarySeed}
            onOpenRecipe={onDetailOpen}
            returnKey={libraryReturnKey}
            favoritePatches={favoritePatches}
            onRecipeFavoriteChange={onRecipeFavoriteChange}
          />
        </View>

        {/* RecipeDetailScreen: conditionally mounted (fresh state per recipe) */}
        {screenState.kind === "detail" && (
          <View style={[styles.screen, !isDetail && styles.hidden]}>
            <RecipeDetailScreen
              recipe={screenState.recipe}
              onBack={onDetailClose}
              onDelete={onDetailClose}
              onGoToShoppingList={onGoToShoppingList}
              onRecipeFavoriteChange={onRecipeFavoriteChange}
            />
          </View>
        )}

        {/* GenerateRecipeScreen: always mounted to preserve chat state */}
        <View style={[styles.screen, activeTab !== "create" && styles.hidden]}>
          <GenerateRecipeScreen
            apiHistory={generateApiHistory}
            onApiHistoryChange={setGenerateApiHistory}
            uiMessages={generateUiMessages}
            onUiMessagesChange={setGenerateUiMessages}
            sessionId={generateSessionId}
            onSessionReset={onSessionReset}
            onRecipeSaved={onRecipeSaved}
          />
        </View>

        <View style={[styles.screen, activeTab !== "list" && styles.hidden]}>
          <ShoppingListScreen />
        </View>

        <View style={[styles.screen, activeTab !== "profile" && styles.hidden]}>
          <ProfileScreen />
        </View>

        <View style={[styles.screen, (activeTab !== "favorites" || isDetail) && styles.hidden]}>
          <FavoritesScreen
            refreshKey={favoritesRefreshKey}
            onOpenRecipe={onDetailOpen}
            onGoToLibrary={() => setActiveTab("library")}
            onRecipeFavoriteChange={onRecipeFavoriteChange}
          />
        </View>
      </View>

      {!isDetail && (
        <DSBottomNav
          activeTab={activeTab}
          onTabPress={handleTabPress}
          bottomInset={insets.bottom}
          labels={navLabels}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
  screen: { ...StyleSheet.absoluteFillObject },
  hidden: { display: "none" },
});
