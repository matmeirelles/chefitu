import { type ReactNode, useRef } from "react";
import { Animated, Pressable, type PressableProps, type ViewStyle } from "react-native";
import { FONTS, MOTION, TYPE_SCALE } from "./tokens";
import { resolveButtonContainerStyle, resolveButtonLabelColor, type ButtonVariant } from "./button-styles";
import { DSText } from "./Text";

type Props = Omit<PressableProps, "style"> & {
  variant?: ButtonVariant;
  full?: boolean;
  style?: ViewStyle;
  children: ReactNode;
};

export const DSButton = ({ variant = "primary", full, style, children, onPressIn, onPressOut, ...rest }: Props) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: Parameters<NonNullable<PressableProps["onPressIn"]>>[0]) => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
    onPressIn?.(e);
  };

  const handlePressOut = (e: Parameters<NonNullable<PressableProps["onPressOut"]>>[0]) => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 2 }).start();
    onPressOut?.(e);
  };

  const containerStyle = resolveButtonContainerStyle(variant);
  const labelColor = resolveButtonLabelColor(variant);

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} {...rest}>
      <Animated.View
        style={[
          containerStyle,
          full && { width: "100%" },
          { transform: [{ scale }] },
          style,
        ]}
      >
        <DSText
          style={{
            fontFamily: FONTS.uiBold,
            fontWeight: "700",
            fontSize: TYPE_SCALE.body,
            color: labelColor,
          }}
        >
          {children}
        </DSText>
      </Animated.View>
    </Pressable>
  );
};
