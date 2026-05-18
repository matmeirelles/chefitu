import type { TextStyle, ViewStyle } from "react-native";
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING, TYPE_SCALE } from "./tokens";

type ChipStyle = { container: ViewStyle; label: TextStyle };

export function resolveChipStyle(active: boolean): ChipStyle {
  return {
    container: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING[2],
      paddingVertical: SPACING[2],
      paddingHorizontal: SPACING[3],
      borderRadius: RADIUS.pill,
      backgroundColor: active ? COLORS.laranjaSoft : COLORS.white,
      borderWidth: active ? 1.5 : 0,
      borderColor: active ? COLORS.laranja : "transparent",
      ...SHADOWS.sm,
    },
    label: {
      fontFamily: FONTS.uiBold,
      fontWeight: "700",
      fontSize: TYPE_SCALE.bodySm,
      color: active ? COLORS.laranja : COLORS.marrom,
    },
  };
}
