import type { ReactNode } from "react";
import { Image, StyleSheet, View } from "react-native";
import { COLORS, FONTS, SPACING, TYPE_SCALE } from "../design-system/tokens";
import { DSText } from "../design-system/Text";
import { DSSearchBar } from "../design-system/SearchBar";

export const LibraryHeader = ({
  topInset,
  greeting,
  subtitle,
  searchPlaceholder,
  yourRecipesTitle,
  recipeCountLabel,
  searchQuery,
  onChangeSearch,
  onFilterPress,
  hasActiveFilters,
  afterTitle,
}: {
  topInset: number;
  greeting: string;
  subtitle: string;
  searchPlaceholder: string;
  yourRecipesTitle: string;
  recipeCountLabel: string;
  searchQuery: string;
  onChangeSearch: (value: string) => void;
  onFilterPress: () => void;
  hasActiveFilters: boolean;
  afterTitle?: ReactNode;
}) => (
  <View style={[styles.header, { paddingTop: topInset + 28 }]}>
    {/* Greeting */}
    <View style={styles.greeting}>
      <View style={styles.mascotWrap}>
        <Image
          source={require("../../assets/mascot-symbol.png")}
          style={styles.mascot}
          resizeMode="contain"
        />
      </View>
      <View style={styles.greetingText}>
        <DSText style={styles.greetingTitle}>{greeting}</DSText>
        <DSText style={styles.greetingSubtitle}>{subtitle}</DSText>
      </View>
    </View>

    {/* Search */}
    <DSSearchBar
      value={searchQuery}
      onChangeText={onChangeSearch}
      placeholder={searchPlaceholder}
      onFilterPress={onFilterPress}
      hasActiveFilters={hasActiveFilters}
    />

    {/* Section title */}
    <View style={styles.titleBlock}>
      <DSText style={styles.title}>{yourRecipesTitle}</DSText>
      <DSText style={styles.subtitle}>{recipeCountLabel}</DSText>
    </View>

    {afterTitle}
  </View>
);

const styles = StyleSheet.create({
  header: {
    gap: SPACING[4],
    paddingBottom: SPACING[4],
    paddingHorizontal: SPACING[4],
  },
  greeting: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING[3],
  },
  mascotWrap: {
    width: 92,
    height: 92,
    flexShrink: 0,
  },
  mascot: {
    width: 92,
    height: 92,
  },
  greetingText: {
    flex: 1,
    gap: 4,
  },
  greetingTitle: {
    fontFamily: FONTS.display,
    fontWeight: "800",
    fontSize: 26,
    lineHeight: 26 * 1.6,
    color: COLORS.marrom,
  },
  greetingSubtitle: {
    fontSize: 18,
    lineHeight: 18 * 1.5,
    color: COLORS.marromSoft,
  },
  titleBlock: {
    marginTop: SPACING[2],
    paddingTop: 4,
    gap: 2,
  },
  title: {
    fontFamily: FONTS.displayBold,
    fontWeight: "700",
    fontSize: TYPE_SCALE.h2,
    lineHeight: TYPE_SCALE.h2 * 1.6,
    color: COLORS.marrom,
  },
  subtitle: {
    fontSize: TYPE_SCALE.bodySm,
    lineHeight: TYPE_SCALE.bodySm * 1.5,
    color: COLORS.marromSoft,
  },
});
