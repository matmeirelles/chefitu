import type { TextStyle } from "react-native";
import { COLORS, FONTS, TYPE_SCALE, LINE_HEIGHT } from "./tokens";

export type TextVariant =
  | "display"
  | "h1"
  | "h2"
  | "h3"
  | "body"
  | "bodySm"
  | "caption"
  | "label"
  | "eyebrow";

export function resolveTextStyle(variant: TextVariant): TextStyle {
  switch (variant) {
    case "display":
      return {
        fontFamily: FONTS.display,
        fontWeight: "800",
        fontSize: TYPE_SCALE.display,
        lineHeight: TYPE_SCALE.display * LINE_HEIGHT.tight,
        letterSpacing: -0.36,
        color: COLORS.marrom,
      };
    case "h1":
      return {
        fontFamily: FONTS.displayBold,
        fontWeight: "700",
        fontSize: TYPE_SCALE.h1,
        lineHeight: TYPE_SCALE.h1 * LINE_HEIGHT.tight,
        letterSpacing: -0.14,
        color: COLORS.marrom,
      };
    case "h2":
      return {
        fontFamily: FONTS.displayBold,
        fontWeight: "700",
        fontSize: TYPE_SCALE.h2,
        lineHeight: TYPE_SCALE.h2 * LINE_HEIGHT.snug,
        color: COLORS.marrom,
      };
    case "h3":
      return {
        fontFamily: FONTS.uiBold,
        fontWeight: "700",
        fontSize: TYPE_SCALE.h3,
        lineHeight: TYPE_SCALE.h3 * LINE_HEIGHT.snug,
        color: COLORS.marrom,
      };
    case "body":
      return {
        fontFamily: FONTS.ui,
        fontWeight: "400",
        fontSize: TYPE_SCALE.body,
        lineHeight: TYPE_SCALE.body * LINE_HEIGHT.base,
        color: COLORS.marrom,
      };
    case "bodySm":
      return {
        fontFamily: FONTS.ui,
        fontWeight: "400",
        fontSize: TYPE_SCALE.bodySm,
        lineHeight: TYPE_SCALE.bodySm * LINE_HEIGHT.base,
        color: COLORS.marromSoft,
      };
    case "caption":
      return {
        fontFamily: FONTS.uiSemiBold,
        fontWeight: "600",
        fontSize: TYPE_SCALE.caption,
        lineHeight: TYPE_SCALE.caption * LINE_HEIGHT.snug,
        letterSpacing: 0.24,
        color: COLORS.marromSoft,
      };
    case "label":
      return {
        fontFamily: FONTS.uiSemiBold,
        fontWeight: "600",
        fontSize: TYPE_SCALE.bodySm,
        lineHeight: TYPE_SCALE.bodySm * LINE_HEIGHT.base,
        color: COLORS.marrom,
      };
    case "eyebrow":
      return {
        fontFamily: FONTS.displayBold,
        fontWeight: "700",
        fontSize: TYPE_SCALE.caption,
        lineHeight: TYPE_SCALE.caption * LINE_HEIGHT.snug,
        letterSpacing: 0.12,
        textTransform: "uppercase",
        color: COLORS.marromSoft,
      };
  }
}
