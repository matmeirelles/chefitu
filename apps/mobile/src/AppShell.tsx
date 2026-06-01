import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ChatMessage, RecipeRecord } from "@chefitu/shared";
import { COLORS } from "./design-system/index";
import { DSBottomNav, type BottomNavTab } from "./design-system/BottomNav";
import { LibraryScreen } from "./screens/LibraryScreen";
import { RecipeDetailScreen } from "./screens/RecipeDetailScreen";
import { QueueScreen } from "./screens/QueueScreen";
import { GenerateRecipeScreen } from "./screens/GenerateRecipeScreen";
import type { UIMessage } from "./screens/GenerateRecipeScreen";
import { buildSessionId } from "./utils/generate-chat";

type ScreenState = { kind: "library" } | { kind: "detail"; recipe: RecipeRecord };

export const AppShell = () => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<BottomNavTab>("library");
  const [screenState, setScreenState] = useState<ScreenState>({ kind: "library" });
  const [librarySeed, setLibrarySeed] = useState(0);
  const [libraryReturnKey, setLibraryReturnKey] = useState(0);

  const [generateApiHistory, setGenerateApiHistory] = useState<ChatMessage[]>([]);
  const [generateUiMessages, setGenerateUiMessages] = useState<UIMessage[]>([]);
  const [generateSessionId, setGenerateSessionId] = useState(() => buildSessionId());

  const onDetailOpen = (recipe: RecipeRecord) => setScreenState({ kind: "detail", recipe });
  const onDetailClose = () => {
    setScreenState({ kind: "library" });
    setLibraryReturnKey((k) => k + 1);
  };

  const onRecipeSaved = () => {
    setLibrarySeed((s) => s + 1);
    setActiveTab("library");
  };

  const onSessionReset = () => setGenerateSessionId(buildSessionId());

  const isDetail = activeTab === "library" && screenState.kind === "detail";

  return (
    <View style={[styles.root, { backgroundColor: COLORS.creme }]}>
      <View style={styles.content}>
        {/* LibraryScreen: always mounted, hidden only when showing detail */}
        <View style={[styles.screen, isDetail && styles.hidden]}>
          <LibraryScreen
            key={librarySeed}
            onOpenRecipe={onDetailOpen}
            returnKey={libraryReturnKey}
          />
        </View>

        {/* RecipeDetailScreen: conditionally mounted (fresh state per recipe) */}
        {screenState.kind === "detail" && (
          <View style={[styles.screen, !isDetail && styles.hidden]}>
            <RecipeDetailScreen
              recipe={screenState.recipe}
              onBack={onDetailClose}
              onDelete={onDetailClose}
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

        {/* QueueScreen: always mounted */}
        <View style={[styles.screen, activeTab !== "list" && styles.hidden]}>
          <QueueScreen />
        </View>
      </View>

      {!isDetail && (
        <DSBottomNav
          activeTab={activeTab}
          onTabPress={setActiveTab}
          bottomInset={insets.bottom}
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
