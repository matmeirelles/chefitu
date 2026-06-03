import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Keyboard,
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
import { DSIcon } from "../design-system/Icon";
import { useLocale } from "../i18n/LocaleContext";

const OUTLINE = "rgba(74, 44, 26, 0.14)";

type Props = {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (name: string) => void;
};

/** Bottom sheet aligned with ImportRecipeFlowSheet / lista handoff (single ingredient field). */
export const AddShoppingItemSheet = ({ visible, onDismiss, onSubmit }: Props) => {
  const insets = useSafeAreaInsets();
  const { t } = useLocale();
  const slideAnim = useRef(new Animated.Value(400)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [name, setName] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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
      setKeyboardVisible(false);
    }
  }, [visible, fadeAnim, slideAnim]);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    onDismiss();
  };

  const sheetBottomPadding = keyboardVisible ? SPACING[2] : insets.bottom + SPACING[5];
  const canSubmit = name.trim().length > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      presentationStyle="overFullScreen"
      onRequestClose={onDismiss}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <View style={styles.backdropSlot}>
          <Animated.View style={[styles.backdropDim, { opacity: fadeAnim }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
          </Animated.View>
        </View>

        <Animated.View
          style={[
            styles.sheetShell,
            keyboardVisible && styles.sheetShellKeyboard,
            {
              paddingBottom: sheetBottomPadding,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.sheetCornerEar} pointerEvents="none" />
          <View style={[styles.sheetCornerEar, styles.sheetCornerEarRight]} pointerEvents="none" />

          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Pressable onPress={onDismiss} style={styles.closeBtn} hitSlop={8}>
              <DSIcon name="X" size={18} color={COLORS.marromSoft} strokeWidth={2} />
            </Pressable>

            <View style={styles.content}>
              <View style={styles.iconCircle}>
                <DSIcon name="ShoppingBag" size={22} color={COLORS.laranja} strokeWidth={2} />
              </View>
              <DSText variant="h2" style={styles.sheetTitle}>
                {t.shoppingList.addSheetTitle}
              </DSText>
              <DSText style={styles.subtitle}>{t.shoppingList.addSheetBody}</DSText>

              <View style={styles.inputWrap}>
                <DSIcon name="Plus" size={18} color={COLORS.marromSoft} strokeWidth={2} />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder={t.shoppingList.addNamePlaceholder}
                  placeholderTextColor={COLORS.marromSoft}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  style={styles.input}
                />
              </View>

              <Pressable
                onPress={handleSubmit}
                disabled={!canSubmit}
                style={[styles.primaryPill, !canSubmit && styles.primaryPillDisabled]}
              >
                <DSIcon name="Plus" size={18} color={COLORS.marrom} strokeWidth={2} />
                <DSText style={styles.primaryPillText}>{t.shoppingList.addSubmit}</DSText>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
  },
  backdropSlot: { flex: 1 },
  backdropDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheetShell: {
    backgroundColor: COLORS.creme,
    borderTopLeftRadius: RADIUS.sheet,
    borderTopRightRadius: RADIUS.sheet,
    ...SHADOWS.lg,
  },
  sheetShellKeyboard: {
    shadowOpacity: 0,
    elevation: 0,
  },
  sheetCornerEar: {
    position: "absolute",
    top: 0,
    left: 0,
    width: RADIUS.sheet + 8,
    height: RADIUS.sheet + 8,
    backgroundColor: COLORS.creme,
    borderTopLeftRadius: RADIUS.sheet,
    zIndex: 2,
  },
  sheetCornerEarRight: {
    left: undefined,
    right: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: RADIUS.sheet,
  },
  sheet: {
    paddingHorizontal: SPACING[5],
    paddingTop: SPACING[3],
    minHeight: 280,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: OUTLINE,
    alignSelf: "center",
    marginBottom: SPACING[2],
  },
  closeBtn: {
    position: "absolute",
    top: SPACING[4],
    right: SPACING[4],
    width: 32,
    height: 32,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
  },
  content: {
    gap: SPACING[4],
    paddingTop: SPACING[2],
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.laranjaSoft,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  sheetTitle: {
    textAlign: "center",
  },
  subtitle: {
    fontSize: TYPE_SCALE.bodySm,
    lineHeight: TYPE_SCALE.bodySm * 1.5,
    color: COLORS.marromSoft,
    textAlign: "center",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING[2],
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.input,
    paddingHorizontal: SPACING[4],
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: OUTLINE,
  },
  input: {
    flex: 1,
    fontSize: TYPE_SCALE.bodySm,
    color: COLORS.marrom,
    paddingVertical: 10,
    fontFamily: FONTS.ui,
  },
  primaryPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING[2],
    backgroundColor: COLORS.begeDeep,
    borderRadius: RADIUS.pill,
    paddingVertical: 14,
  },
  primaryPillDisabled: { opacity: 0.5 },
  primaryPillText: {
    fontFamily: FONTS.uiBold,
    fontWeight: "700",
    fontSize: 15,
    color: COLORS.marrom,
  },
});
