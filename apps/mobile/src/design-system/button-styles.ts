import type { ViewStyle } from "react-native";
import { COLORS, RADIUS, SHADOWS } from "./tokens";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "ghost";

const BASE: ViewStyle = {
  height: 48,
  borderRadius: RADIUS.pill,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  paddingHorizontal: 22,
  gap: 8,
};

const VARIANT_STYLES: Record<ButtonVariant, ViewStyle> = {
  primary: {
    ...BASE,
    backgroundColor: COLORS.laranja,
    ...SHADOWS.cta,
  },
  secondary: {
    ...BASE,
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: COLORS.marrom,
  },
  tertiary: {
    ...BASE,
    backgroundColor: COLORS.bege,
    borderWidth: 0,
  },
  ghost: {
    ...BASE,
    backgroundColor: "transparent",
    borderWidth: 0,
  },
};

export function resolveButtonContainerStyle(variant: ButtonVariant): ViewStyle {
  return VARIANT_STYLES[variant];
}

export function resolveButtonLabelColor(variant: ButtonVariant): string {
  return variant === "primary" ? COLORS.white : COLORS.marrom;
}
