import { Image, Pressable, StyleSheet, View } from "react-native";
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from "./tokens";
import { DSIcon, type IconName } from "./Icon";
import { DSText } from "./Text";

export type BottomNavTab = "library" | "favorites" | "create" | "list" | "profile";

type TabConfig =
  | { id: BottomNavTab; icon: IconName; isMascot?: false }
  | { id: BottomNavTab; isMascot: true };

const TAB_ORDER: TabConfig[] = [
  { id: "library", icon: "Home" },
  { id: "favorites", icon: "Heart" },
  { id: "create", isMascot: true },
  { id: "list", icon: "ShoppingBag" },
  { id: "profile", icon: "User" },
];

export type BottomNavLabels = Record<BottomNavTab, string>;

const DEFAULT_LABELS: BottomNavLabels = {
  library: "Início",
  favorites: "Favoritos",
  create: "Chefitu",
  list: "Lista",
  profile: "Perfil",
};

type Props = {
  activeTab: BottomNavTab;
  onTabPress: (tab: BottomNavTab) => void;
  bottomInset?: number;
  labels?: BottomNavLabels;
};

export const DSBottomNav = ({ activeTab, onTabPress, bottomInset = 0, labels = DEFAULT_LABELS }: Props) => (
  <View style={[styles.container, { paddingBottom: bottomInset + SPACING[2] }]}>
    {TAB_ORDER.map((tab) => {
      const label = labels[tab.id];
      if (tab.isMascot) {
        const isActive = activeTab === tab.id;
        return (
          <Pressable key={tab.id} onPress={() => onTabPress(tab.id)} style={styles.fabItem}>
            <View style={[styles.mascotButton, isActive && styles.mascotButtonActive]}>
              <Image
                source={require("../../assets/mascot-symbol.png")}
                style={styles.mascotImage}
              />
            </View>
            <DSText style={[styles.tabLabel, { color: isActive ? COLORS.laranja : COLORS.marromSoft }]}>
              {label}
            </DSText>
          </Pressable>
        );
      }

      const isActive = activeTab === tab.id;
      return (
        <Pressable key={tab.id} onPress={() => onTabPress(tab.id)} style={styles.tabItem}>
          <DSIcon
            name={tab.icon}
            size={22}
            color={isActive ? COLORS.laranja : COLORS.marromSoft}
            strokeWidth={isActive ? 2.2 : 1.75}
          />
          <DSText style={[styles.tabLabel, { color: isActive ? COLORS.laranja : COLORS.marromSoft }]}>
            {label}
          </DSText>
        </Pressable>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: COLORS.white,
    paddingTop: SPACING[2],
    paddingHorizontal: SPACING[2],
    borderTopWidth: 1,
    borderTopColor: "rgba(74, 44, 26, 0.08)",
    ...SHADOWS.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
    paddingVertical: SPACING[1],
  },
  fabItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: SPACING[1],
  },
  tabLabel: {
    fontFamily: FONTS.uiBold,
    fontWeight: "700",
    fontSize: 11,
  },
  mascotButton: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.laranja,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -22,
    shadowColor: COLORS.laranja,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.42,
    shadowRadius: 14,
    elevation: 8,
  },
  mascotButtonActive: {
    shadowOpacity: 0.55,
  },
  mascotImage: {
    width: 42,
    height: 42,
    resizeMode: "contain",
  },
});
