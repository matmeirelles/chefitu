import { useEffect, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING, TYPE_SCALE } from "../design-system/tokens";
import { DSText } from "../design-system/Text";
import { DSButton } from "../design-system/Button";
import { useLocale } from "../i18n/LocaleContext";

const OUTLINE = "rgba(74, 44, 26, 0.14)";

type Props = {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (name: string, quantity: string) => void;
};

export const AddShoppingItemSheet = ({ visible, onDismiss, onSubmit }: Props) => {
  const insets = useSafeAreaInsets();
  const { t } = useLocale();
  const slideAnim = useRef(new Animated.Value(400)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");

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
        Animated.timing(slideAnim, { toValue: 400, duration: 180, useNativeDriver: true }),
      ]).start();
      setName("");
      setQuantity("");
    }
  }, [visible, fadeAnim, slideAnim]);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit(trimmed, quantity.trim());
    onDismiss();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: insets.bottom + SPACING[5],
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <DSText style={styles.title}>{t.shoppingList.addSheetTitle}</DSText>

          <DSText style={styles.label}>{t.shoppingList.addNameLabel}</DSText>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t.shoppingList.addNamePlaceholder}
            placeholderTextColor={COLORS.marromSoft}
            style={styles.input}
            autoFocus
          />

          <DSText style={styles.label}>{t.shoppingList.addQtyLabel}</DSText>
          <TextInput
            value={quantity}
            onChangeText={setQuantity}
            placeholder={t.shoppingList.addQtyPlaceholder}
            placeholderTextColor={COLORS.marromSoft}
            style={styles.input}
          />

          <DSButton full onPress={handleSubmit} style={styles.submitBtn}>
            {t.shoppingList.addSubmit}
          </DSButton>

          <Pressable onPress={onDismiss} style={styles.cancelBtn}>
            <DSText style={styles.cancelLabel}>{t.shoppingList.addCancel}</DSText>
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(74, 44, 26, 0.35)",
  },
  sheet: {
    backgroundColor: COLORS.creme,
    borderTopLeftRadius: RADIUS.sheet,
    borderTopRightRadius: RADIUS.sheet,
    paddingHorizontal: SPACING[5],
    paddingTop: SPACING[5],
    gap: SPACING[3],
    ...SHADOWS.lg,
  },
  title: {
    fontFamily: FONTS.displayBold,
    fontWeight: "700",
    fontSize: TYPE_SCALE.h2,
    lineHeight: TYPE_SCALE.h2 * 1.35,
    color: COLORS.marrom,
    marginBottom: SPACING[1],
  },
  label: {
    fontSize: TYPE_SCALE.bodySm,
    fontWeight: "600",
    color: COLORS.marromSoft,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: OUTLINE,
    borderRadius: RADIUS.input,
    paddingHorizontal: SPACING[4],
    paddingVertical: 14,
    fontSize: TYPE_SCALE.body,
    color: COLORS.marrom,
    fontFamily: FONTS.ui,
  },
  submitBtn: { marginTop: SPACING[2] },
  cancelBtn: { alignItems: "center", paddingVertical: SPACING[2] },
  cancelLabel: {
    fontSize: TYPE_SCALE.bodySm,
    color: COLORS.marromSoft,
    fontWeight: "600",
  },
});
