import { useRef } from "react";
import { Animated, Image, Pressable, StyleSheet, View } from "react-native";
import { COLORS, FONTS, MOTION, RADIUS, SHADOWS, SPACING, TYPE_SCALE } from "./tokens";
import { DSText } from "./Text";
import { DSTag } from "./Tag";
import { DSIcon } from "./Icon";
import type { TagVariant } from "./tag-styles";

export type TagData = { label: string; variant?: TagVariant };

type RecipeCardProps = {
  title: string;
  timeLabel?: string;
  rating?: number;
  tags?: TagData[];
  imageUri?: string;
  isFavorite?: boolean;
  onPress?: () => void;
  onFavoritePress?: () => void;
};

export const DSRecipeCard = ({
  title,
  timeLabel,
  rating,
  tags = [],
  imageUri,
  isFavorite = false,
  onPress,
  onFavoritePress,
}: RecipeCardProps) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 0 }).start();

  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 2 }).start();

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        {/* Photo */}
        <View style={styles.photoContainer}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.photoFallback]} />
          )}
          {/* Favorite button */}
          <Pressable onPress={onFavoritePress} style={styles.favBtn}>
            <DSIcon
              name="Heart"
              size={16}
              color={isFavorite ? COLORS.coracao : COLORS.marrom}
              strokeWidth={isFavorite ? 0 : 2}
            />
          </Pressable>
        </View>

        {/* Content */}
        <View style={styles.body}>
          <DSText style={styles.title} numberOfLines={2}>{title}</DSText>

          {(timeLabel || rating != null) && (
            <View style={styles.meta}>
              {timeLabel && (
                <>
                  <DSIcon name="Clock" size={13} color={COLORS.marromSoft} strokeWidth={2} />
                  <DSText style={styles.metaText}>{timeLabel}</DSText>
                </>
              )}
              {rating != null && (
                <>
                  <DSIcon name="Star" size={13} color={COLORS.laranja} strokeWidth={0} fill={COLORS.laranja} />
                  <DSText style={[styles.metaText, { color: COLORS.marrom }]}>{rating.toFixed(1)}</DSText>
                </>
              )}
            </View>
          )}

          {tags.length > 0 && (
            <View style={styles.tags}>
              {tags.map((t) => (
                <DSTag key={t.label} label={t.label} variant={t.variant ?? "orange"} />
              ))}
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
};

// ─── Compact card (horizontal list row) ──────────────────────────────────────

type CompactCardProps = {
  title: string;
  timeLabel?: string;
  imageUri?: string;
  isFavorite?: boolean;
  tag?: TagData;
  onPress?: () => void;
};

export const DSCompactRecipeCard = ({
  title,
  timeLabel,
  imageUri,
  isFavorite = false,
  tag,
  onPress,
}: CompactCardProps) => (
  <Pressable onPress={onPress} style={styles.compactCard}>
    <View style={styles.compactPhoto}>
      {imageUri && (
        <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      )}
    </View>
    <View style={styles.compactBody}>
      <DSText style={styles.compactTitle} numberOfLines={2}>{title}</DSText>
      {timeLabel && (
        <DSText style={styles.compactMeta}>{timeLabel}</DSText>
      )}
      {tag && <DSTag label={tag.label} variant={tag.variant ?? "orange"} />}
    </View>
    <DSIcon name="Heart" size={18} color={isFavorite ? COLORS.coracao : COLORS.marrom} strokeWidth={isFavorite ? 0 : 2} />
  </Pressable>
);

const styles = StyleSheet.create({
  // Full card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    overflow: "hidden",
    ...SHADOWS.md,
  },
  photoContainer: {
    width: "100%",
    aspectRatio: 4 / 3,
    backgroundColor: COLORS.bege,
    overflow: "hidden",
    position: "relative",
  },
  photoFallback: {
    backgroundColor: COLORS.bege,
  },
  favBtn: {
    position: "absolute",
    top: SPACING[2],
    right: SPACING[2],
    width: 34,
    height: 34,
    borderRadius: RADIUS.pill,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    padding: SPACING[3],
    gap: SPACING[1],
  },
  title: {
    fontFamily: FONTS.displayBold,
    fontWeight: "700",
    fontSize: TYPE_SCALE.h3,
    color: COLORS.marrom,
    lineHeight: TYPE_SCALE.h3 * 1.2,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING[1],
  },
  metaText: {
    fontSize: TYPE_SCALE.caption,
    color: COLORS.marromSoft,
    fontWeight: "600",
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING[1],
    marginTop: SPACING[1],
  },

  // Compact card
  compactCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.card,
    padding: SPACING[2],
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING[3],
    ...SHADOWS.sm,
  },
  compactPhoto: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.xs + 2,
    backgroundColor: COLORS.bege,
    flexShrink: 0,
    overflow: "hidden",
  },
  compactBody: {
    flex: 1,
    gap: SPACING[1],
  },
  compactTitle: {
    fontFamily: FONTS.displayBold,
    fontWeight: "700",
    fontSize: TYPE_SCALE.bodySm,
    color: COLORS.marrom,
    lineHeight: TYPE_SCALE.bodySm * 1.15,
  },
  compactMeta: {
    fontSize: 11,
    color: COLORS.marromSoft,
    fontWeight: "600",
  },
});
