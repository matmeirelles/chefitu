import { ScrollView, StyleSheet, View } from "react-native";
import { COLORS, FONTS, TYPE_SCALE } from "../design-system/tokens";
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
  <View style={[styles.header, { paddingTop: topInset + 12 }]}>
    <DSSearchBar
      value={searchQuery}
      onChangeText={onChangeSearch}
      placeholder="Buscar receitas, ingredientes…"
    />

    <View style={styles.titleBlock}>
      <DSText style={styles.title}>Minhas receitas</DSText>
      <DSText style={styles.subtitle}>
        {recipeCount} {recipeCount === 1 ? "receita salva" : "receitas salvas"}
      </DSText>
    </View>

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
    gap: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  titleBlock: {
    gap: 2,
  },
  title: {
    fontFamily: FONTS.displayBold,
    fontWeight: "700",
    fontSize: TYPE_SCALE.h1,
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
