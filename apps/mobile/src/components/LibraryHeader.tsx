import { Image, ScrollView, StyleSheet, View } from "react-native";
import { COLORS, FONTS, SPACING, TYPE_SCALE } from "../design-system/tokens";
import { DSText } from "../design-system/Text";
import { DSSearchBar } from "../design-system/SearchBar";
import { DSChip } from "../design-system/Chip";

export const LibraryHeader = ({
  topInset,
  searchQuery,
  onChangeSearch,
  filters,
  selectedFilter,
  onSelectFilter,
  recipeCount,
}: {
  topInset: number;
  searchQuery: string;
  onChangeSearch: (value: string) => void;
  filters: string[];
  selectedFilter: string;
  onSelectFilter: (value: string) => void;
  recipeCount: number;
}) => (
  <View style={[styles.header, { paddingTop: topInset + 16 }]}>
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
        <DSText style={styles.greetingTitle}>Olá, Chefitu! 👋</DSText>
        <DSText style={styles.greetingSubtitle}>O que vamos cozinhar hoje?</DSText>
      </View>
    </View>

    {/* Search */}
    <DSSearchBar
      value={searchQuery}
      onChangeText={onChangeSearch}
      placeholder="Buscar receitas, ingredientes…"
    />

    {/* Section title */}
    <View style={styles.titleBlock}>
      <DSText style={styles.title}>Suas receitas</DSText>
      <DSText style={styles.subtitle}>
        {recipeCount} {recipeCount === 1 ? "receita" : "receitas"}
      </DSText>
    </View>

    {/* Filter chips */}
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipsRow}
    >
      {filters.map((item) => (
        <DSChip
          key={item}
          label={item}
          active={item === selectedFilter}
          onPress={() => onSelectFilter(item)}
        />
      ))}
    </ScrollView>
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
    width: 64,
    height: 64,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: COLORS.creme,
  },
  mascot: {
    width: 64,
    height: 64,
  },
  greetingText: {
    flex: 1,
    gap: 2,
  },
  greetingTitle: {
    fontFamily: FONTS.display,
    fontWeight: "800",
    fontSize: TYPE_SCALE.h2,
    color: COLORS.marrom,
  },
  greetingSubtitle: {
    fontSize: TYPE_SCALE.body,
    color: COLORS.marromSoft,
  },
  titleBlock: {
    gap: 2,
  },
  title: {
    fontFamily: FONTS.displayBold,
    fontWeight: "700",
    fontSize: TYPE_SCALE.h2,
    color: COLORS.marrom,
  },
  subtitle: {
    fontSize: TYPE_SCALE.bodySm,
    color: COLORS.marromSoft,
  },
  chipsRow: {
    gap: 8,
    paddingRight: 20,
  },
});
