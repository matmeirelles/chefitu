import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import type { ImportBannerState } from "../../hooks/use-import-flow";
import { LOADING_STEPS } from "../../hooks/use-import-flow";
import { IMPORT_LOADING_STICKER_ID } from "../../design-system/illustrations";
import { DSMascotSticker } from "../../design-system/MascotSticker";
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING, TYPE_SCALE } from "../../design-system/tokens";
import { DSText } from "../../design-system/Text";
import { DSIcon } from "../../design-system/Icon";

type Props = {
  banner: ImportBannerState;
  loadingStep: number;
  loadingPercent: number;
  onPress: () => void;
};

export const ImportProgressBanner = ({
  banner,
  loadingStep,
  loadingPercent,
  onPress,
}: Props) => {
  const slideAnim = useRef(new Animated.Value(-24)).current;

  useEffect(() => {
    slideAnim.setValue(-24);
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 70,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, [banner.phase, slideAnim]);

  const isLoading = banner.phase === "loading";
  const isSuccess = banner.phase === "success";
  const isError = banner.phase === "failed" || banner.phase === "no_recipe";
  const stepIndex = isLoading ? loadingStep : banner.loadingStep;
  const percent = isLoading ? loadingPercent : banner.loadingPercent;
  const step = LOADING_STEPS[Math.min(stepIndex, LOADING_STEPS.length - 1)];

  return (
    <Animated.View style={[styles.wrap, { transform: [{ translateY: slideAnim }] }]}>
      <Pressable onPress={onPress} style={styles.banner} accessibilityRole="button">
        {isLoading && (
          <>
            <DSMascotSticker id={IMPORT_LOADING_STICKER_ID} size={40} />
            <View style={styles.loadingCol}>
              <DSText style={styles.loadingLabel}>{step}…</DSText>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.min(percent, 100)}%` }]} />
              </View>
            </View>
            <DSText style={styles.percent}>{Math.round(percent)}%</DSText>
          </>
        )}

        {isSuccess && (
          <>
            <View style={[styles.statusIcon, styles.statusSuccess]}>
              <DSIcon name="Check" size={20} color={COLORS.white} strokeWidth={2.5} />
            </View>
            <DSText style={styles.statusLabel}>Receita pronta!</DSText>
            <DSIcon name="ChevronRight" size={18} color={COLORS.marromSoft} strokeWidth={2} />
          </>
        )}

        {isError && (
          <>
            <View style={[styles.statusIcon, styles.statusError]}>
              <DSIcon name="X" size={20} color={COLORS.white} strokeWidth={2.5} />
            </View>
            <DSText style={styles.statusLabel}>
              {banner.phase === "no_recipe" ? "Não achei receita nesse link" : "Algo deu errado"}
            </DSText>
            <DSIcon name="ChevronRight" size={18} color={COLORS.marromSoft} strokeWidth={2} />
          </>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginBottom: SPACING[1],
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING[3],
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.pill,
    paddingVertical: 12,
    paddingHorizontal: SPACING[4],
    ...SHADOWS.md,
  },
  loadingCol: {
    flex: 1,
    gap: 6,
  },
  loadingLabel: {
    fontFamily: FONTS.uiBold,
    fontWeight: "700",
    fontSize: TYPE_SCALE.bodySm,
    color: COLORS.marrom,
  },
  progressTrack: {
    height: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bege,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.laranja,
    borderRadius: RADIUS.pill,
  },
  percent: {
    fontFamily: FONTS.uiBold,
    fontWeight: "700",
    fontSize: TYPE_SCALE.bodySm,
    color: COLORS.laranja,
  },
  statusIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  statusSuccess: {
    backgroundColor: COLORS.verdeFolha,
  },
  statusError: {
    backgroundColor: COLORS.danger,
  },
  statusLabel: {
    flex: 1,
    fontFamily: FONTS.uiBold,
    fontWeight: "700",
    fontSize: TYPE_SCALE.body,
    color: COLORS.marrom,
  },
});
