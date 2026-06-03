import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AddShoppingItemSheet } from "../components/AddShoppingItemSheet";
import { useShoppingList } from "../context/ShoppingListContext";
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING, TYPE_SCALE } from "../design-system/tokens";
import { DSText } from "../design-system/Text";
import { DSIcon } from "../design-system/Icon";
import { DSMascotSticker } from "../design-system/MascotSticker";
import { useLocale } from "../i18n/LocaleContext";
import type { ShoppingListItem } from "../storage/shopping-list";

const OUTLINE = "rgba(74, 44, 26, 0.10)";

export const ShoppingListScreen = () => {
  const insets = useSafeAreaInsets();
  const { t } = useLocale();
  const { items, ready, addManualItem, togglePurchased } = useShoppingList();
  const [sheetVisible, setSheetVisible] = useState(false);

  const pending = useMemo(() => items.filter((i) => !i.purchased), [items]);
  const purchased = useMemo(() => items.filter((i) => i.purchased), [items]);

  const handleAdd = (name: string) => {
    addManualItem(name);
  };

  return (
    <View style={[styles.root, { backgroundColor: COLORS.creme }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + SPACING[5], paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <DSText style={styles.screenTitle}>{t.shoppingList.title}</DSText>

        {ready && items.length === 0 ? (
          <View style={styles.emptyWrap}>
            <DSMascotSticker id="reveal" size={148} />
            <DSText style={styles.emptyTitle}>{t.shoppingList.emptyTitle}</DSText>
            <DSText style={styles.emptyBody}>{t.shoppingList.emptyBody}</DSText>
          </View>
        ) : (
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
        )}

        <Pressable
          onPress={() => setSheetVisible(true)}
          style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
        >
          <DSIcon name="Plus" size={18} color={COLORS.white} strokeWidth={2.5} />
          <DSText style={styles.addBtnLabel}>{t.shoppingList.addItem}</DSText>
        </Pressable>
      </ScrollView>

      <AddShoppingItemSheet
        visible={sheetVisible}
        onDismiss={() => setSheetVisible(false)}
        onSubmit={handleAdd}
      />
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
      <View
        style={[
          styles.checkbox,
          purchased && styles.checkboxChecked,
        ]}
      >
        {purchased && <DSIcon name="Check" size={14} color={COLORS.white} strokeWidth={3} />}
      </View>
      <DSText
        style={[styles.itemName, purchased && styles.itemNamePurchased]}
      >
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
    borderBottomColor: OUTLINE,
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
  emptyWrap: {
    alignItems: "center",
    paddingHorizontal: SPACING[4],
    paddingTop: SPACING[2],
    paddingBottom: SPACING[4],
    gap: SPACING[3],
  },
  emptyTitle: {
    fontFamily: FONTS.displayBold,
    fontWeight: "700",
    fontSize: TYPE_SCALE.h2,
    lineHeight: TYPE_SCALE.h2 * 1.4,
    color: COLORS.marrom,
    textAlign: "center",
  },
  emptyBody: {
    fontSize: TYPE_SCALE.body,
    lineHeight: TYPE_SCALE.body * 1.5,
    color: COLORS.marromSoft,
    textAlign: "center",
  },
  addBtn: {
    height: 50,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.laranja,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING[2],
    shadowColor: COLORS.laranja,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 6,
  },
  addBtnPressed: { opacity: 0.92 },
  addBtnLabel: {
    fontFamily: FONTS.uiBold,
    fontWeight: "800",
    fontSize: 15,
    color: COLORS.white,
  },
});
