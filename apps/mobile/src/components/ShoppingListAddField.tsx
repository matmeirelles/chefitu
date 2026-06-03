import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING, TYPE_SCALE } from "../design-system/tokens";
import { DSIcon } from "../design-system/Icon";

const OUTLINE = "rgba(74, 44, 26, 0.14)";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  onSubmit: () => void;
  canSubmit: boolean;
};

/** Inline add bar from lista handoff: + inside field, arrow submit on the right. */
export const ShoppingListAddField = ({
  value,
  onChangeText,
  placeholder,
  onSubmit,
  canSubmit,
}: Props) => (
  <View style={styles.row}>
    <View style={styles.field}>
      <DSIcon name="Plus" size={18} color={COLORS.marromSoft} strokeWidth={2.2} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.marromSoft}
        returnKeyType="done"
        onSubmitEditing={onSubmit}
        style={styles.input}
      />
    </View>
    <Pressable
      onPress={onSubmit}
      disabled={!canSubmit}
      style={({ pressed }) => [
        styles.submitBtn,
        !canSubmit && styles.submitBtnDisabled,
        pressed && canSubmit && styles.submitBtnPressed,
      ]}
      accessibilityRole="button"
    >
      <DSIcon name="ArrowRight" size={18} color={COLORS.white} strokeWidth={2.4} />
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING[2],
  },
  field: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING[2],
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.input,
    paddingLeft: SPACING[3] + 2,
    paddingRight: SPACING[3],
    minHeight: 50,
    borderWidth: 1,
    borderColor: OUTLINE,
    ...SHADOWS.sm,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.ui,
    fontSize: TYPE_SCALE.bodySm,
    color: COLORS.marrom,
    paddingVertical: 12,
  },
  submitBtn: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.marrom,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.sm,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnPressed: { opacity: 0.88 },
});
