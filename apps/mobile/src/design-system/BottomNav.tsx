import { Image, Pressable, StyleSheet, View } from "react-native";
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from "./tokens";
import { DSIcon, type IconName } from "./Icon";
import { DSText } from "./Text";

export type BottomNavTab = "library" | "favorites" | "create" | "list" | "profile";

type TabConfig =
  | { id: BottomNavTab; label: string; icon: IconName; isMascot?: false }
  | { id: BottomNavTab; label: string; isMascot: true };

const TABS: TabConfig[] = [
  { id: "library",   label: "Início",    icon: "Home" },
  { id: "favorites", label: "Favoritos", icon: "Heart" },
  { id: "create",    label: "Chefitu",   isMascot: true },
  { id: "list",      label: "Lista",     icon: "ShoppingBag" },
  { id: "profile",   label: "Perfil",    icon: "User" },
];

type Props = {
  activeTab: BottomNavTab;
  onTabPress: (tab: BottomNavTab) => void;
  bottomInset?: number;
};

export const DSBottomNav = ({ activeTab, onTabPress, bottomInset = 0 }: Props) => (
  <View style={[styles.container, { paddingBottom: bottomInset + SPACING[2] }]}>
    {TABS.map((tab) => {
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
              {tab.label}
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
            {tab.label}
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
