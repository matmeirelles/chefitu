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
  <View style={[styles.container, { paddingBottom: bottomInset + SPACING[2] }]}>
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
  tabLabel: {
    fontFamily: FONTS.uiBold,
    fontWeight: "700",
    fontSize: 11,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.laranja,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -18,
    ...SHADOWS.cta,
  },
});
