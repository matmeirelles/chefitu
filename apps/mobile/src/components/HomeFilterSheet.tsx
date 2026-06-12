import { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONTS, RADIUS, SPACING, TYPE_SCALE } from "../design-system/tokens";
import { DSText } from "../design-system/Text";
import { DSIcon } from "../design-system/Icon";
import { DSChip } from "../design-system/Chip";
import { DSButton } from "../design-system/Button";
import { useLocale } from "../i18n/LocaleContext";
import type { HomeFilters } from "../utils/filter";

type Props = {
  visible: boolean;
  stagedFilters: HomeFilters;
  categories: string[];
  onStagedChange: (filters: HomeFilters) => void;
  onApply: () => void;
  onClear: () => void;
  onDismiss: () => void;
};

export const HomeFilterSheet = ({
  visible,
  stagedFilters,
  categories,
  onStagedChange,
  onApply,
  onClear,
  onDismiss,
}: Props) => {
  const insets = useSafeAreaInsets();
  const { t } = useLocale();
  const slideAnim = useRef(new Animated.Value(600)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 600, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  const prepTimeOptions: Array<{ label: string; value: HomeFilters["prepTime"] }> = [
    { label: t.filters.prepTime15, value: "15" },
    { label: t.filters.prepTime30, value: "30" },
    { label: t.filters.prepTime60, value: "60" },
    { label: t.filters.prepTime60plus, value: "60+" },
  ];

  const setPrepTime = (value: NonNullable<HomeFilters["prepTime"]>) => {
    onStagedChange({
      ...stagedFilters,
      prepTime: stagedFilters.prepTime === value ? null : value,
    });
  };

  const setCategory = (value: string) => {
    onStagedChange({
      ...stagedFilters,
      category: stagedFilters.category === value ? null : value,
    });
  };

  const setOnlyFavorites = (value: boolean) => {
    onStagedChange({ ...stagedFilters, onlyFavorites: value });
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} pointerEvents="auto">
          <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: insets.bottom + SPACING[4],
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.sheetHeader}>
            <DSText style={styles.sheetTitle}>{t.filters.title}</DSText>
            <Pressable style={styles.closeBtn} onPress={onDismiss} hitSlop={8}>
              <DSIcon name="X" size={20} color={COLORS.marrom} strokeWidth={2} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <DSText style={styles.sectionTitle}>{t.filters.prepTime}</DSText>
            <View style={styles.chipsWrap}>
              {prepTimeOptions.map((opt) => (
                <DSChip
                  key={opt.value}
                  label={opt.label}
                  active={stagedFilters.prepTime === opt.value}
                  onPress={() => setPrepTime(opt.value as NonNullable<HomeFilters["prepTime"]>)}
                />
              ))}
            </View>

            {categories.length > 0 && (
              <>
                <View style={styles.divider} />
                <DSText style={styles.sectionTitle}>{t.filters.category}</DSText>
                <View style={styles.chipsWrap}>
                  {categories.map((cat) => (
                    <DSChip
                      key={cat}
                      label={cat}
                      active={stagedFilters.category === cat}
                      onPress={() => setCategory(cat)}
                    />
                  ))}
                </View>
              </>
            )}

            <View style={styles.divider} />

            <View style={styles.favoritesRow}>
              <DSText style={styles.sectionTitle}>{t.filters.onlyFavorites}</DSText>
              <Switch
                value={stagedFilters.onlyFavorites}
                onValueChange={setOnlyFavorites}
                trackColor={{ false: COLORS.bege, true: COLORS.laranjaSoft }}
                thumbColor={stagedFilters.onlyFavorites ? COLORS.laranja : COLORS.white}
                ios_backgroundColor={COLORS.bege}
              />
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <View style={styles.actionBtn}>
              <DSButton variant="secondary" full onPress={onClear}>
                {t.filters.clear}
              </DSButton>
            </View>
            <View style={styles.actionBtn}>
              <DSButton variant="primary" full onPress={onApply}>
                {t.filters.apply}
              </DSButton>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.creme,
    borderTopLeftRadius: RADIUS.sheet,
    borderTopRightRadius: RADIUS.sheet,
    paddingTop: SPACING[3],
    maxHeight: "88%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: "rgba(74, 44, 26, 0.18)",
    alignSelf: "center",
    marginBottom: SPACING[3],
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING[5],
    marginBottom: SPACING[4],
    position: "relative",
  },
  sheetTitle: {
    fontFamily: FONTS.displayBold,
    fontWeight: "700",
    fontSize: TYPE_SCALE.h2,
    color: COLORS.marrom,
  },
  closeBtn: {
    position: "absolute",
    right: SPACING[5],
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING[5],
    paddingBottom: SPACING[4],
    gap: SPACING[4],
  },
  sectionTitle: {
    fontFamily: FONTS.uiBold,
    fontWeight: "700",
    fontSize: TYPE_SCALE.body,
    color: COLORS.marrom,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING[2],
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(74, 44, 26, 0.12)",
  },
  favoritesRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actions: {
    flexDirection: "row",
    gap: SPACING[3],
    paddingHorizontal: SPACING[5],
    paddingTop: SPACING[4],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(74, 44, 26, 0.12)",
  },
  actionBtn: {
    flex: 1,
  },
});
