import { Pressable, StyleSheet, View } from "react-native";
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from "../../design-system/tokens";
import { DSText } from "../../design-system/Text";
import { DSIcon } from "../../design-system/Icon";

type Props = {
  count: number;
  bottomOffset: number;
  onPress: () => void;
};

export const ImportProblemPill = ({ count, bottomOffset, onPress }: Props) => {
  if (count <= 0) return null;

  const label = count === 1 ? "1 com problema" : `${count} com problema`;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.pill, { bottom: bottomOffset }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.iconWrap}>
        <DSIcon name="AlertCircle" size={14} color={COLORS.danger} strokeWidth={2} />
      </View>
      <DSText style={styles.label}>{label}</DSText>
      <DSIcon name="ChevronRight" size={16} color={COLORS.marromSoft} strokeWidth={2} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pill: {
    position: "absolute",
    alignSelf: "center",
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING[2],
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.pill,
    paddingVertical: 12,
    paddingHorizontal: SPACING[4],
    ...SHADOWS.md,
    zIndex: 19,
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.dangerBg,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    flex: 1,
    fontFamily: FONTS.uiBold,
    fontWeight: "700",
    fontSize: 14,
    color: COLORS.marrom,
  },
});
