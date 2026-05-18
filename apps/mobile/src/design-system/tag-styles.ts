import type { TextStyle, ViewStyle } from "react-native";
import { COLORS, RADIUS, TYPE_SCALE, FONTS } from "./tokens";

export type TagVariant = "orange" | "green" | "brown";

type TagStyle = { container: ViewStyle; label: TextStyle };

const SHARED_CONTAINER: ViewStyle = {
  borderRadius: RADIUS.pill,
  paddingHorizontal: 10,
  paddingVertical: 4,
  alignSelf: "flex-start",
};

const SHARED_LABEL: TextStyle = {
  fontFamily: FONTS.uiBold,
  fontWeight: "700",
  fontSize: TYPE_SCALE.bodySm,
};

const VARIANT_STYLES: Record<TagVariant, TagStyle> = {
  orange: {
    container: { ...SHARED_CONTAINER, backgroundColor: COLORS.laranjaSoft },
    label: { ...SHARED_LABEL, color: COLORS.marrom },
  },
  green: {
    container: { ...SHARED_CONTAINER, backgroundColor: COLORS.salvia },
    label: { ...SHARED_LABEL, color: COLORS.verdeDark },
  },
  brown: {
    container: { ...SHARED_CONTAINER, backgroundColor: COLORS.bege },
    label: { ...SHARED_LABEL, color: COLORS.marrom },
  },
};

export function resolveTagStyle(variant: TagVariant): TagStyle {
  return VARIANT_STYLES[variant];
}
