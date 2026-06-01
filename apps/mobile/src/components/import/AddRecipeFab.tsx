import { Pressable, StyleSheet, View } from "react-native";
import { COLORS, RADIUS } from "../../design-system/tokens";
import { DSIcon } from "../../design-system/Icon";

type Props = {
  onPress: () => void;
  bottomOffset: number;
};

export const AddRecipeFab = ({ onPress, bottomOffset }: Props) => (
  <View style={[styles.fabShadow, { bottom: bottomOffset }]}>
    <Pressable
      onPress={onPress}
      style={styles.fab}
      accessibilityRole="button"
      accessibilityLabel="Adicionar receita por link"
    >
      <DSIcon name="Plus" size={26} color={COLORS.white} strokeWidth={2.5} />
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  fabShadow: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.laranja,
    shadowColor: COLORS.marrom,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 22,
    elevation: 14,
    zIndex: 20,
  },
  fab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.pill,
  },
});
