import { Pressable, StyleSheet } from "react-native";
import { ActivityIndicator, Card, Text, useTheme } from "react-native-paper";

export const StateCard = ({
  title,
  body,
  loading = false,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  loading?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}) => {
  const theme = useTheme();

  return (
    <Card mode="contained" style={styles.stateCard}>
      <Card.Content style={styles.stateCardContent}>
        {loading ? <ActivityIndicator size="small" /> : null}
        <Text variant="headlineSmall">{title}</Text>
        <Text variant="bodyLarge" style={styles.stateBody}>
          {body}
        </Text>
        {actionLabel && onAction ? (
          <Pressable onPress={onAction} style={styles.retryButton}>
            <Text variant="labelLarge" style={{ color: theme.colors.primary }}>
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  stateCard: {
    borderRadius: 28,
    marginTop: 12,
  },
  stateCardContent: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 28,
  },
  stateBody: {
    textAlign: "center",
  },
  retryButton: {
    marginTop: 4,
  },
});
