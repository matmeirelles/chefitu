import { useMemo, useState } from "react";
import { Keyboard, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useShoppingList } from "../context/ShoppingListContext";
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING, TYPE_SCALE } from "../design-system/tokens";
import { DSText } from "../design-system/Text";
import { DSIcon } from "../design-system/Icon";
import { useLocale } from "../i18n/LocaleContext";
import type { ShoppingListItem } from "../storage/shopping-list";

const OUTLINE = "rgba(74, 44, 26, 0.14)";

export const ShoppingListScreen = () => {
  const insets = useSafeAreaInsets();
  const { t } = useLocale();
  const { items, addManualItem, togglePurchased } = useShoppingList();
  const [draft, setDraft] = useState("");

  const pending = useMemo(() => items.filter((i) => !i.purchased), [items]);
  const purchased = useMemo(() => items.filter((i) => i.purchased), [items]);
  const canAdd = draft.trim().length > 0;

  const handleAdd = () => {
    const name = draft.trim();
    if (!name) return;
    addManualItem(name);
    setDraft("");
    Keyboard.dismiss();
  };

  return (
    <View style={[styles.root, { backgroundColor: COLORS.creme }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + SPACING[5], paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <DSText style={styles.screenTitle}>{t.shoppingList.title}</DSText>

        <View style={styles.addRow}>
          <View style={styles.addInputWrap}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={t.shoppingList.addNamePlaceholder}
              placeholderTextColor={COLORS.marromSoft}
              returnKeyType="done"
              onSubmitEditing={handleAdd}
              style={styles.addInput}
            />
          </View>
          <Pressable
            onPress={handleAdd}
            disabled={!canAdd}
            style={({ pressed }) => [
              styles.addBtn,
              !canAdd && styles.addBtnDisabled,
              pressed && canAdd && styles.addBtnPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={t.shoppingList.addItem}
          >
            <DSIcon name="Plus" size={20} color={COLORS.white} strokeWidth={2.5} />
          </Pressable>
        </View>

        <View style={styles.card}>
          <SectionHeader title={t.shoppingList.pending} count={pending.length} />
          {pending.length === 0 ? (
            <DSText style={styles.sectionEmpty}>{t.shoppingList.pendingEmpty}</DSText>
          ) : (
            pending.map((item, index) => (
              <ShoppingRow
                key={item.id}
                item={item}
                purchased={false}
                isLast={index === pending.length - 1 && purchased.length === 0}
                onToggle={() => togglePurchased(item.id)}
              />
            ))
          )}

          {purchased.length > 0 && (
            <>
              <View style={styles.purchasedHeader}>
                <SectionHeader title={t.shoppingList.purchased} count={purchased.length} />
              </View>
              {purchased.map((item, index) => (
                <ShoppingRow
                  key={item.id}
                  item={item}
                  purchased
                  isLast={index === purchased.length - 1}
                  onToggle={() => togglePurchased(item.id)}
                />
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const SectionHeader = ({ title, count }: { title: string; count: number }) => (
  <View style={styles.sectionHeader}>
    <DSText style={styles.sectionTitle}>{title}</DSText>
    <DSText style={styles.sectionCount}>{count}</DSText>
  </View>
);

const ShoppingRow = ({
  item,
  purchased,
  isLast,
  onToggle,
}: {
  item: ShoppingListItem;
  purchased: boolean;
  isLast: boolean;
  onToggle: () => void;
}) => (
  <Pressable onPress={onToggle}>
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <View style={[styles.checkbox, purchased && styles.checkboxChecked]}>
        {purchased && <DSIcon name="Check" size={14} color={COLORS.white} strokeWidth={3} />}
      </View>
      <DSText style={[styles.itemName, purchased && styles.itemNamePurchased]}>
        {item.name}
      </DSText>
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingHorizontal: SPACING[4],
    gap: SPACING[4],
  },
  screenTitle: {
    fontFamily: FONTS.displayBold,
    fontWeight: "700",
    fontSize: TYPE_SCALE.h1,
    lineHeight: TYPE_SCALE.h1 * 1.45,
    color: COLORS.marrom,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING[2],
  },
  addInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.input,
    paddingHorizontal: SPACING[4],
    minHeight: 50,
    borderWidth: 1,
    borderColor: OUTLINE,
    ...SHADOWS.sm,
  },
  addInput: {
    flex: 1,
    fontFamily: FONTS.ui,
    fontSize: TYPE_SCALE.bodySm,
    color: COLORS.marrom,
    paddingVertical: 12,
  },
  addBtn: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.input,
    backgroundColor: COLORS.laranja,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.laranja,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  addBtnDisabled: { opacity: 0.45 },
  addBtnPressed: { opacity: 0.92 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3] + 2,
    ...SHADOWS.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING[2],
  },
  sectionTitle: {
    fontFamily: FONTS.uiBold,
    fontWeight: "700",
    fontSize: TYPE_SCALE.body,
    color: COLORS.marrom,
  },
  sectionCount: {
    fontSize: TYPE_SCALE.bodySm,
    fontWeight: "700",
    color: COLORS.marromSoft,
  },
  sectionEmpty: {
    fontSize: TYPE_SCALE.bodySm,
    color: COLORS.marromSoft,
    paddingVertical: SPACING[2],
  },
  purchasedHeader: {
    marginTop: SPACING[3] + 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING[3],
    paddingVertical: SPACING[2],
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(74, 44, 26, 0.10)",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.marrom,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    borderWidth: 0,
    backgroundColor: COLORS.verdeFolha,
  },
  itemName: {
    flex: 1,
    fontSize: TYPE_SCALE.body,
    fontWeight: "600",
    color: COLORS.marrom,
  },
  itemNamePurchased: {
    color: COLORS.marromSoft,
    textDecorationLine: "line-through",
  },
});
