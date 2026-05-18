import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING, TYPE_SCALE } from "./tokens";
import { DSText } from "./Text";
import { DSButton } from "./Button";

type Props = {
  title: string;
  body: string;
  loading?: boolean;
  actionLabel?: string;
  onAction?: () => void;
};

export const DSStateCard = ({ title, body, loading = false, actionLabel, onAction }: Props) => (
  <View style={styles.card}>
    {loading && <ActivityIndicator size="large" color={COLORS.laranja} />}
    <DSText style={styles.title}>{title}</DSText>
    <DSText style={styles.body}>{body}</DSText>
    {actionLabel && onAction && (
      <DSButton variant="tertiary" onPress={onAction} style={styles.actionBtn}>
        {actionLabel}
      </DSButton>
    )}
  </View>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.sheet,
    backgroundColor: COLORS.bege,
    alignItems: "center",
    gap: SPACING[3],
    paddingVertical: SPACING[8],
    paddingHorizontal: SPACING[6],
    marginTop: SPACING[3],
    ...SHADOWS.sm,
  },
  title: {
    fontFamily: FONTS.displayBold,
    fontWeight: "700",
    fontSize: TYPE_SCALE.h3,
    color: COLORS.marrom,
    textAlign: "center",
  },
  body: {
    fontSize: TYPE_SCALE.body,
    color: COLORS.marromSoft,
    textAlign: "center",
    lineHeight: TYPE_SCALE.body * 1.45,
  },
  actionBtn: {
    marginTop: SPACING[1],
  },
});
