import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import { resolveTextStyle, type TextVariant } from "./text-styles";

type Props = RNTextProps & {
  variant?: TextVariant;
};

export const DSText = ({ variant = "body", style, ...rest }: Props) => (
  <RNText style={[resolveTextStyle(variant), style]} {...rest} />
);
