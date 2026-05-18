import { Pressable, StyleSheet, View } from "react-native";
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING, TYPE_SCALE } from "./tokens";
import { DSIcon, type IconName } from "./Icon";
import { DSText } from "./Text";

export type BottomNavTab = "library" | "create" | "queue";

type TabConfig = {
  id: BottomNavTab;
  label: string;
  icon: IconName;
  isFab?: boolean;
};

const TABS: TabConfig[] = [
  { id: "library", label: "Início",    icon: "Home" },
  { id: "create",  label: "",          icon: "Plus", isFab: true },
  { id: "queue",   label: "Pendentes", icon: "Inbox" },
];

type Props = {
  activeTab: BottomNavTab;
  onTabPress: (tab: BottomNavTab) => void;
  bottomInset?: number;
};

export const DSBottomNav = ({ activeTab, onTabPress, bottomInset = 0 }: Props) => (
  <View style={[styles.container, { bottom: 16 + bottomInset }]}>
    {TABS.map((tab) => {
      if (tab.isFab) {
        return (
          <Pressable key={tab.id} onPress={() => onTabPress(tab.id)} style={styles.fab}>
            <DSIcon name="Plus" size={28} color={COLORS.white} strokeWidth={2.5} />
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
    position: "absolute",
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.sheet,
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[2],
    ...SHADOWS.md,
    // Extra shadow for the floating pill effect
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.10,
    shadowRadius: 32,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
    paddingVertical: SPACING[1],
  },
  tabLabel: {
    fontFamily: FONTS.uiBold,
    fontWeight: "700",
    fontSize: 11,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.laranja,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -22,
    ...SHADOWS.cta,
  },
});
