import { StyleSheet, View } from "react-native";
import { COLORS, FONTS, SPACING } from "./tokens";
import { DSText } from "./Text";
import { DSIcon } from "./Icon";
import type { IconName } from "./Icon";

type Props = {
  icon: IconName;
  label: string;
  value?: string;
};

export const DSMetricCard = ({ icon, label, value }: Props) => (
  <View style={styles.card}>
    <DSIcon name={icon} size={18} color={COLORS.laranja} strokeWidth={2.2} />
    <DSText style={styles.label}>{label}</DSText>
    {value !== undefined && (
      <DSText style={styles.value}>{value}</DSText>
    )}
  </View>
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 72,
    alignItems: "center",
    justifyContent: "flex-start",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: SPACING[2],
    backgroundColor: COLORS.white,
    shadowColor: COLORS.marrom,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  label: {
    fontFamily: FONTS.uiBold,
    fontWeight: "700",
    fontSize: 10,
    lineHeight: 12,
    color: COLORS.marromSoft,
    marginTop: 4,
    textAlign: "center",
  },
  value: {
    fontFamily: FONTS.uiBold,
    fontWeight: "700",
    fontSize: 12,
    lineHeight: 15,
    color: COLORS.marrom,
    textAlign: "center",
  },
});
