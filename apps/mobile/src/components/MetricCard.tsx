import { StyleSheet } from "react-native";
import { Surface, Text, useTheme } from "react-native-paper";

export const MetricCard = ({ value, label }: { value: string; label: string }) => {
  const theme = useTheme();

  return (
    <Surface
      style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}
      elevation={0}
    >
      <Text style={[styles.value, { color: theme.colors.onSurface }]}>{value}</Text>
      <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
        {label.toUpperCase()}
      </Text>
    </Surface>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    borderRadius: 16,
    paddingVertical: 14,
  },
  value: {
    fontSize: 22,
    fontWeight: "500",
    lineHeight: 28,
    letterSpacing: -0.02,
  },
  label: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.5,
    marginTop: 2,
  },
});
