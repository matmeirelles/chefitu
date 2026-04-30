import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Avatar, Icon, Searchbar, Text, useTheme } from "react-native-paper";

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
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.header, { paddingTop: topInset + 8 }]}>
      <Searchbar
        value={searchQuery}
        onChangeText={onChangeSearch}
        placeholder="Search recipes"
        icon="magnify"
        traileringIcon={() => <Avatar.Text size={30} label="M" />}
        style={styles.searchbar}
        inputStyle={styles.searchbarInput}
      />

      <View style={styles.titleBlock}>
        <Text variant="headlineMedium" style={{ color: theme.colors.onSurface }}>
          My recipes
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {recipeCount} saved recipes
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {filters.map((item) => {
          const selected = item === selectedFilter;
          return (
            <Pressable
              key={item}
              onPress={() => onSelectFilter(item)}
              style={[
                styles.chip,
                {
                  backgroundColor: selected
                    ? theme.colors.secondaryContainer
                    : "transparent",
                  borderColor: selected ? "transparent" : theme.colors.outline,
                },
              ]}
            >
              {selected && (
                <Icon source="check" size={16} color={theme.colors.onSecondaryContainer} />
              )}
              <Text
                variant="labelLarge"
                style={{
                  color: selected
                    ? theme.colors.onSecondaryContainer
                    : theme.colors.onSurfaceVariant,
                }}
              >
                {item}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    gap: 16,
    paddingBottom: 16,
  },
  searchbar: {
    borderRadius: 28,
  },
  searchbarInput: {
    minHeight: 56,
  },
  titleBlock: {
    gap: 4,
  },
  chipsRow: {
    gap: 8,
    paddingRight: 20,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
});
