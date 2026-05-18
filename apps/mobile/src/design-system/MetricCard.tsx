import { StyleSheet, View } from "react-native";
import { COLORS, FONTS, RADIUS, SHADOWS, TYPE_SCALE } from "./tokens";
import { DSText } from "./Text";

type Props = {
  value: string;
  label: string;
};

export const DSMetricCard = ({ value, label }: Props) => (
  <View style={styles.card}>
    <DSText style={styles.value}>{value}</DSText>
    <DSText style={styles.label}>{label.toUpperCase()}</DSText>
  </View>
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    borderRadius: RADIUS.card,
    paddingVertical: 14,
    backgroundColor: COLORS.bege,
    ...SHADOWS.sm,
  },
  value: {
    fontFamily: FONTS.displayBold,
    fontWeight: "700",
    fontSize: TYPE_SCALE.h2,
    color: COLORS.marrom,
    lineHeight: TYPE_SCALE.h2 * 1.1,
  },
  label: {
    fontFamily: FONTS.uiSemiBold,
    fontWeight: "600",
    fontSize: TYPE_SCALE.caption,
    letterSpacing: 0.5,
    color: COLORS.marromSoft,
  },
});
