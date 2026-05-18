import { Pressable } from "react-native";
import { DSText } from "./Text";
import { resolveChipStyle } from "./chip-styles";

type Props = {
  label: string;
  active?: boolean;
  onPress?: () => void;
};

export const DSChip = ({ label, active = false, onPress }: Props) => {
  const { container, label: labelStyle } = resolveChipStyle(active);
  return (
    <Pressable style={container} onPress={onPress}>
      <DSText style={labelStyle}>{label}</DSText>
    </Pressable>
  );
};
