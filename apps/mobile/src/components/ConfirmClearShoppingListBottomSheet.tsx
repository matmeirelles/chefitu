import { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONTS, RADIUS, SPACING, TYPE_SCALE } from "../design-system/tokens";
import { DSText } from "../design-system/Text";
import { DSIcon } from "../design-system/Icon";
import { useLocale } from "../i18n/LocaleContext";

type Props = {
  visible: boolean;
  clearing: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export const ConfirmClearShoppingListBottomSheet = ({
  visible,
  clearing,
  onConfirm,
  onCancel,
}: Props) => {
  const insets = useSafeAreaInsets();
  const { t } = useLocale();
  const slideAnim = useRef(new Animated.Value(240)).current;
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
        Animated.timing(slideAnim, { toValue: 240, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel}>
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} pointerEvents="auto">
          <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} disabled={clearing} />
        </Animated.View>

        <Animated.View
          style={[
            styles.container,
            { bottom: insets.bottom + SPACING[4], transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.mainCard}>
            <DSText style={styles.title}>{t.shoppingList.clearTitle}</DSText>
            <DSText style={styles.body}>{t.shoppingList.clearBody}</DSText>

            <View style={styles.divider} />

            <Pressable
              style={({ pressed }) => [
                styles.confirmRow,
                clearing && styles.disabled,
                pressed && !clearing && styles.rowPressed,
              ]}
              onPress={onConfirm}
              disabled={clearing}
            >
              <DSIcon name="Trash2" size={18} color={COLORS.danger} strokeWidth={1.75} />
              <DSText style={styles.confirmLabel}>
                {clearing ? t.shoppingList.clearSubmitting : t.shoppingList.clearConfirm}
              </DSText>
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [styles.cancelCard, pressed && !clearing && styles.cancelCardPressed]}
            onPress={onCancel}
            disabled={clearing}
          >
            <DSText style={styles.cancelLabel}>{t.shoppingList.clearCancel}</DSText>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
};

const OUTLINE = "rgba(74, 44, 26, 0.12)";

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  container: {
    position: "absolute",
    left: SPACING[4],
    right: SPACING[4],
    gap: SPACING[2],
  },
  mainCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.sheet,
    paddingTop: SPACING[5],
    overflow: "hidden",
  },
  title: {
    fontFamily: FONTS.uiBold,
    fontSize: TYPE_SCALE.h3,
    fontWeight: "700",
    color: COLORS.marrom,
    textAlign: "center",
    paddingHorizontal: SPACING[5],
    marginBottom: SPACING[2],
  },
  body: {
    fontFamily: FONTS.ui,
    fontSize: TYPE_SCALE.bodySm,
    lineHeight: 20,
    color: COLORS.marromSoft,
    textAlign: "center",
    paddingHorizontal: SPACING[5],
    marginBottom: SPACING[4],
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: OUTLINE,
  },
  confirmRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING[2],
    paddingVertical: 18,
  },
  confirmLabel: {
    fontFamily: FONTS.uiSemiBold,
    fontSize: TYPE_SCALE.body,
    fontWeight: "600",
    color: COLORS.danger,
  },
  disabled: { opacity: 0.5 },
  rowPressed: { backgroundColor: COLORS.dangerBg },
  cancelCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.sheet,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
  },
  cancelCardPressed: { backgroundColor: COLORS.cremeDeep },
  cancelLabel: {
    fontFamily: FONTS.uiSemiBold,
    fontSize: TYPE_SCALE.body,
    fontWeight: "600",
    color: COLORS.marrom,
  },
});
