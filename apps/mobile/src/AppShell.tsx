import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon, Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { RecipeRecord } from "@my-recipes/shared";
import { LibraryScreen } from "./screens/LibraryScreen";
import { RecipeDetailScreen } from "./screens/RecipeDetailScreen";
import { QueueScreen } from "./screens/QueueScreen";

type Tab = "library" | "queue";
type ScreenState = { kind: "library" } | { kind: "detail"; recipe: RecipeRecord };

export const AppShell = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>("library");
  const [screenState, setScreenState] = useState<ScreenState>({ kind: "library" });

  const onDetailOpen = (recipe: RecipeRecord) =>
    setScreenState({ kind: "detail", recipe });
  const onDetailClose = () => setScreenState({ kind: "library" });
  const onDetailDelete = () => setScreenState({ kind: "library" });

  const isDetail = activeTab === "library" && screenState.kind === "detail";

  return (
    <View style={styles.root}>
      {/* Content */}
      <View style={styles.content}>
        {activeTab === "library" ? (
          screenState.kind === "detail" ? (
            <RecipeDetailScreen recipe={screenState.recipe} onBack={onDetailClose} onDelete={onDetailDelete} />
          ) : (
            <LibraryScreen onOpenRecipe={onDetailOpen} />
          )
        ) : (
          <QueueScreen />
        )}
      </View>

      {/* Bottom tab bar — hidden on detail screen */}
      {!isDetail && (
        <View
          style={[
            styles.tabBar,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.outline,
              paddingBottom: insets.bottom,
            },
          ]}
        >
          <TabItem
            label="Home"
            icon={activeTab === "library" ? "home" : "home-outline"}
            active={activeTab === "library"}
            onPress={() => setActiveTab("library")}
          />
          <TabItem
            label="Queue"
            icon="tray"
            active={activeTab === "queue"}
            onPress={() => setActiveTab("queue")}
          />
        </View>
      )}
    </View>
  );
};

const TabItem = ({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: string;
  active: boolean;
  onPress: () => void;
}) => {
  const theme = useTheme();
  const color = active ? theme.colors.primary : theme.colors.onSurfaceVariant;

  return (
    <Pressable onPress={onPress} style={styles.tabItem}>
      <Icon source={icon} size={24} color={color} />
      <Text style={[styles.tabLabel, { color }]}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
    paddingBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
});
