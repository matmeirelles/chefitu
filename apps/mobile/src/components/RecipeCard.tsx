import { useRef } from "react";
import { Animated, Image, Pressable, StyleSheet, View } from "react-native";
import { Icon, Text, useTheme } from "react-native-paper";
import type { RecipeRecord } from "@my-recipes/shared";
import { FALLBACK_COVER_IMAGE } from "../constants";

export const RecipeCard = ({
  recipe,
  onPress,
}: {
  recipe: RecipeRecord;
  onPress: () => void;
}) => {
  const theme = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 2,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: "#FEF1EB", transform: [{ scale }] },
        ]}
      >
        <Image
          source={{ uri: recipe.coverImageUrl ?? FALLBACK_COVER_IMAGE }}
          style={styles.photo}
        />
        <View style={styles.body}>
          <Text
            style={[styles.title, { color: theme.colors.onSurface }]}
            numberOfLines={2}
          >
            {recipe.title}
          </Text>

          <View style={styles.meta}>
            <Icon source="clock-time-four-outline" size={13} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
              {recipe.totalTimeMinutes ? `${recipe.totalTimeMinutes} min` : "—"}
            </Text>
            <View style={[styles.metaDot, { backgroundColor: theme.colors.outline }]} />
            <Icon source="account-outline" size={13} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
              {recipe.servings?.split(" ")[0] ?? "—"} serv.
            </Text>
            <View style={[styles.metaDot, { backgroundColor: theme.colors.outline }]} />
            <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
              {recipe.category ?? "Recipe"}
            </Text>
          </View>

          <View style={styles.tags}>
            {recipe.tags.slice(0, 3).map((tag) => (
              <View key={tag} style={[styles.tag, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Text style={[styles.tagText, { color: theme.colors.onSurfaceVariant }]}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: 16,
    padding: 12,
    borderRadius: 16,
    alignItems: "flex-start",
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 12,
    flexShrink: 0,
  },
  body: {
    flex: 1,
    paddingTop: 2,
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    letterSpacing: 0.4,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
});
