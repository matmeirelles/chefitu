import { useRef, useState } from "react";
import { Animated, Keyboard, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ConfirmClearShoppingListBottomSheet } from "../components/ConfirmClearShoppingListBottomSheet";
import { ShoppingListAddField } from "../components/ShoppingListAddField";
import { useShoppingList } from "../context/ShoppingListContext";
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING, TYPE_SCALE } from "../design-system/tokens";
import { DSText } from "../design-system/Text";
import { DSIcon } from "../design-system/Icon";
import { useLocale } from "../i18n/LocaleContext";
import type { ShoppingListItem } from "../storage/shopping-list";

const REMOVE_MS = 240;
const OUTLINE = "rgba(74, 44, 26, 0.10)";

export const ShoppingListScreen = () => {
  const insets = useSafeAreaInsets();
  const { t } = useLocale();
  const { items, addManualItem, removeItem, clearList } = useShoppingList();
  const [draft, setDraft] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const canAdd = draft.trim().length > 0;

  const handleAdd = () => {
    const name = draft.trim();
    if (!name) return;
    addManualItem(name);
    setDraft("");
    Keyboard.dismiss();
  };

  const handleClearList = () => setConfirmClear(true);

  const handleConfirmClear = () => {
    setClearing(true);
    clearList();
    setClearing(false);
    setConfirmClear(false);
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

        <ShoppingListAddField
          value={draft}
          onChangeText={setDraft}
          placeholder={t.shoppingList.addPlaceholder}
          onSubmit={handleAdd}
          canSubmit={canAdd}
        />

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <DSText style={styles.cardTitle}>{t.shoppingList.cardTitle}</DSText>
            {items.length > 0 && (
              <Pressable
                onPress={handleClearList}
                style={({ pressed }) => [styles.clearBtn, pressed && styles.clearBtnPressed]}
              >
                <DSText style={styles.clearBtnText}>{t.shoppingList.clearList}</DSText>
              </Pressable>
            )}
          </View>

          {items.length === 0 ? (
            <View style={styles.emptyWrap}>
              <DSText style={styles.emptyEmoji}>🎉</DSText>
              <DSText style={styles.emptyTitle}>{t.shoppingList.emptyTitle}</DSText>
              <DSText style={styles.emptyBody}>{t.shoppingList.emptyBody}</DSText>
            </View>
          ) : (
            items.map((item, index) => (
              <ShoppingRow
                key={item.id}
                item={item}
                isLast={index === items.length - 1}
                onRemove={() => removeItem(item.id)}
              />
            ))
          )}
        </View>

        {items.length > 0 && (
          <View style={styles.hintRow}>
            <DSIcon name="Check" size={14} color={COLORS.marromSoft} strokeWidth={2.2} />
            <DSText style={styles.hintText}>{t.shoppingList.removeHint}</DSText>
          </View>
        )}
      </ScrollView>

      <ConfirmClearShoppingListBottomSheet
        visible={confirmClear}
        clearing={clearing}
        onConfirm={handleConfirmClear}
        onCancel={() => setConfirmClear(false)}
      />
    </View>
  );
};

const ShoppingRow = ({
  item,
  isLast,
  onRemove,
}: {
  item: ShoppingListItem;
  isLast: boolean;
  onRemove: () => void;
}) => {
  const opacity = useRef(new Animated.Value(1)).current;
  const [checked, setChecked] = useState(false);

  const handlePress = () => {
    if (checked) return;
    setChecked(true);
    Animated.timing(opacity, {
      toValue: 0,
      duration: REMOVE_MS,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onRemove();
    });
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View
        style={[
          styles.row,
          !isLast && styles.rowBorder,
          { opacity },
        ]}
      >
        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
          {checked && <DSIcon name="Check" size={14} color={COLORS.white} strokeWidth={3} />}
        </View>
        <DSText style={styles.rowEmoji}>{item.emoji}</DSText>
        <DSText style={[styles.itemName, checked && styles.itemNameChecked]}>
          {item.name}
        </DSText>
      </Animated.View>
    </Pressable>
  );
};

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
    paddingVertical: SPACING[4],
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING[3],
  },
  cardTitle: {
    fontFamily: FONTS.displayBold,
    fontWeight: "700",
    fontSize: 19,
    lineHeight: 24,
    color: COLORS.marrom,
  },
  clearBtn: {
    backgroundColor: COLORS.laranjaSoft,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearBtnPressed: { opacity: 0.85 },
  clearBtnText: {
    fontFamily: FONTS.uiBold,
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.laranja,
  },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: SPACING[6],
    paddingHorizontal: SPACING[3],
    gap: SPACING[2],
  },
  emptyEmoji: { fontSize: 40, lineHeight: 48 },
  emptyTitle: {
    fontFamily: FONTS.displayBold,
    fontWeight: "700",
    fontSize: TYPE_SCALE.h2,
    lineHeight: TYPE_SCALE.h2 * 1.35,
    color: COLORS.marrom,
    textAlign: "center",
  },
  emptyBody: {
    fontSize: TYPE_SCALE.bodySm,
    lineHeight: TYPE_SCALE.bodySm * 1.55,
    color: COLORS.marromSoft,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING[3],
    paddingVertical: SPACING[2] + 2,
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
  rowEmoji: { fontSize: 18, width: 24, textAlign: "center" },
  itemName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.marrom,
  },
  itemNameChecked: {
    color: COLORS.marromSoft,
    textDecorationLine: "line-through",
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING[2],
    paddingHorizontal: SPACING[1],
  },
  hintText: {
    flex: 1,
    fontSize: TYPE_SCALE.caption,
    lineHeight: TYPE_SCALE.caption * 1.45,
    color: COLORS.marromSoft,
    fontWeight: "600",
  },
});
