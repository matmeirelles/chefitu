import { View } from "react-native";
import { DSText } from "./Text";
import { resolveTagStyle, type TagVariant } from "./tag-styles";

type Props = {
  label: string;
  variant?: TagVariant;
};

export const DSTag = ({ label, variant = "orange" }: Props) => {
  const { container, label: labelStyle } = resolveTagStyle(variant);
  return (
    <View style={container}>
      <DSText style={labelStyle}>{label}</DSText>
    </View>
  );
};
