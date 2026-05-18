import { Pressable, TextInput, type TextInputProps, View, StyleSheet } from "react-native";
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING, TYPE_SCALE } from "./tokens";
import { DSIcon } from "./Icon";

type Props = Pick<TextInputProps, "value" | "onChangeText" | "placeholder">;

export const DSSearchBar = ({
  value,
  onChangeText,
  placeholder = "Buscar receitas, ingredientes…",
}: Props) => (
  <View style={styles.container}>
    <DSIcon name="Search" size={20} color={COLORS.marromSoft} strokeWidth={2} />
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={COLORS.marromSoft}
      style={styles.input}
    />
    <Pressable style={styles.filterBtn}>
      <DSIcon name="SlidersHorizontal" size={15} color={COLORS.marrom} strokeWidth={2} />
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING[3],
    backgroundColor: COLORS.white,
    height: 50,
    borderRadius: RADIUS.input,
    paddingHorizontal: SPACING[4],
    ...SHADOWS.sm,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.ui,
    fontSize: TYPE_SCALE.bodySm,
    color: COLORS.marrom,
  },
  filterBtn: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.xs,
    backgroundColor: COLORS.bege,
    alignItems: "center",
    justifyContent: "center",
  },
});
