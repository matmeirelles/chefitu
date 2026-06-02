import { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { MascotStickerId } from "../design-system/illustrations";
import { DSMascotSticker } from "../design-system/MascotSticker";
import { COLORS, FONTS, RADIUS, SPACING, TYPE_SCALE } from "../design-system/tokens";
import { DSText } from "../design-system/Text";
import { useLocale } from "../i18n/LocaleContext";

const STICKER_SIZE = 140;
const DEFAULT_STICKER: MascotStickerId = "baking";

export type InConstructionBottomSheetProps = {
  visible: boolean;
  onDismiss: () => void;
  /** Override headline; defaults to locale `construction.title`. */
  title?: string;
  /** Override body; defaults to locale `construction.body`. */
  message?: string;
  /** Mascot sticker; defaults to `thinking`. */
  stickerId?: MascotStickerId;
  /** Override dismiss button label. */
  dismissLabel?: string;
};

/**
 * Reusable bottom sheet for features that are not shipped yet.
 * Not tied to delete flows or other domain-specific sheets.
 */
export const InConstructionBottomSheet = ({
  visible,
  onDismiss,
  title,
  message,
  stickerId = DEFAULT_STICKER,
  dismissLabel,
}: InConstructionBottomSheetProps) => {
  const insets = useSafeAreaInsets();
  const { t } = useLocale();
  const slideAnim = useRef(new Animated.Value(280)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const headline = title ?? t.construction.title;
  const body = message ?? t.construction.body;
  const closeLabel = dismissLabel ?? t.construction.dismiss;

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
        Animated.timing(slideAnim, { toValue: 280, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

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
              paddingTop: SPACING[4],
              paddingBottom: insets.bottom + SPACING[5],
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.stickerWrap}>
            <DSMascotSticker id={stickerId} size={STICKER_SIZE} />
          </View>
          <DSText style={styles.title}>{headline}</DSText>
          <DSText style={styles.body}>{body}</DSText>
          <Pressable
            onPress={onDismiss}
            style={({ pressed }) => [styles.dismissBtn, pressed && styles.dismissBtnPressed]}
          >
            <DSText style={styles.dismissLabel}>{closeLabel}</DSText>
          </Pressable>
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
    paddingHorizontal: SPACING[5],
    alignItems: "center",
    gap: SPACING[3],
    maxHeight: "88%",
  },
  stickerWrap: {
    marginTop: SPACING[1],
    marginBottom: SPACING[1],
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: "rgba(74, 44, 26, 0.18)",
    marginBottom: SPACING[2],
  },
  title: {
    fontFamily: FONTS.displayBold,
    fontWeight: "700",
    fontSize: TYPE_SCALE.h2,
    lineHeight: TYPE_SCALE.h2 * 1.45,
    color: COLORS.marrom,
    textAlign: "center",
    alignSelf: "stretch",
  },
  body: {
    fontFamily: FONTS.ui,
    fontSize: TYPE_SCALE.body,
    lineHeight: TYPE_SCALE.body * 1.5,
    color: COLORS.marromSoft,
    textAlign: "center",
    paddingHorizontal: SPACING[2],
  },
  dismissBtn: {
    alignSelf: "stretch",
    backgroundColor: COLORS.laranja,
    borderRadius: RADIUS.pill,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: SPACING[2],
  },
  dismissBtnPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  dismissLabel: {
    fontFamily: FONTS.uiBold,
    fontWeight: "700",
    fontSize: TYPE_SCALE.body,
    color: COLORS.white,
  },
});
