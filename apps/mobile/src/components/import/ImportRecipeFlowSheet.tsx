import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { RecipeRecord } from "@chefitu/shared";
import { LOADING_STEPS, type ImportFlowPhase } from "../../hooks/use-import-flow";
import { parseImportSource } from "../../utils/import-source";
import type { ImportSourceInfo } from "../../utils/import-source";
import { resolveImageUrl } from "../../services/api";
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING, TYPE_SCALE } from "../../design-system/tokens";
import { DSText } from "../../design-system/Text";
import { DSIcon } from "../../design-system/Icon";
import { ImportSourceIcon } from "./ImportSourceIcon";
import { ImportResultLayout } from "./ImportResultLayout";
import { IMPORT_FLOW_STICKER_BY_KIND } from "../../design-system/illustrations";
import { FALLBACK_COVER_IMAGE } from "../../constants";

const OUTLINE = "rgba(74, 44, 26, 0.14)";

type Props = {
  visible: boolean;
  phase: ImportFlowPhase;
  sourceUrl: string;
  recipe: RecipeRecord | null;
  loadingStep: number;
  loadingPercent: number;
  isSubmitting: boolean;
  isActionLoading: boolean;
  onClose: () => void;
  onDismiss: () => void;
  onSubmitUrl: (url: string) => void;
  onDiscard: () => void;
  onRetry: () => void;
  onViewRecipe: (recipe: RecipeRecord) => void;
};

export const ImportRecipeFlowSheet = ({
  visible,
  phase,
  sourceUrl,
  recipe,
  loadingStep,
  loadingPercent,
  isSubmitting,
  isActionLoading,
  onClose,
  onDismiss,
  onSubmitUrl,
  onDiscard,
  onRetry,
  onViewRecipe,
}: Props) => {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(400)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [url, setUrl] = useState("");
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
      setUrl("");
      setKeyboardVisible(false);
    }
  }, [visible, fadeAnim, slideAnim]);

  const source = parseImportSource(sourceUrl || url);
  const busy = isSubmitting || isActionLoading;
  const canClose = !busy || phase === "success" || phase === "no_recipe" || phase === "failed";

  const handleClose = () => {
    if (phase === "loading" && !isSubmitting) {
      onDismiss();
      return;
    }
    if (phase === "success" || phase === "failed" || phase === "no_recipe") {
      if (canClose) onDismiss();
      return;
    }
    if (canClose) onClose();
  };

  const sheetBottomPadding = keyboardVisible ? SPACING[2] : insets.bottom + SPACING[5];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      presentationStyle="overFullScreen"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <View style={styles.backdropSlot}>
          <Animated.View style={[styles.backdropDim, { opacity: fadeAnim }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} disabled={!canClose} />
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
            <Pressable
              onPress={handleClose}
              disabled={!canClose}
              style={styles.closeBtn}
              hitSlop={8}
            >
              <DSIcon name="X" size={18} color={COLORS.marromSoft} strokeWidth={2} />
            </Pressable>

            {phase === "paste" && (
              <PasteView
                url={url}
                onChangeUrl={setUrl}
                submitting={isSubmitting}
                onSubmit={() => onSubmitUrl(url)}
              />
            )}

            {phase === "loading" && (
              <LoadingView
                source={source}
                sourceUrl={sourceUrl}
                stepIndex={loadingStep}
                percent={loadingPercent}
              />
            )}

            {phase === "success" && recipe && (
              <SuccessView
                recipe={recipe}
                source={source}
                onViewRecipe={() => onViewRecipe(recipe)}
              />
            )}

            {phase === "no_recipe" && (
              <ErrorView
                variant="no_recipe"
                source={source}
                sourceUrl={sourceUrl}
                busy={isActionLoading}
                onDiscard={onDiscard}
                onRetry={onRetry}
              />
            )}

            {phase === "failed" && (
              <ErrorView
                variant="failed"
                source={source}
                sourceUrl={sourceUrl}
                busy={isActionLoading}
                onDiscard={onDiscard}
                onRetry={onRetry}
              />
            )}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const PasteView = ({
  url,
  onChangeUrl,
  submitting,
  onSubmit,
}: {
  url: string;
  onChangeUrl: (v: string) => void;
  submitting: boolean;
  onSubmit: () => void;
}) => (
  <View style={styles.content}>
    <View style={styles.iconCircle}>
      <DSIcon name="Share2" size={22} color={COLORS.laranja} strokeWidth={2} />
    </View>
    <DSText variant="h2" style={styles.sheetTitle}>
      Importar de um link
    </DSText>
    <DSText style={styles.subtitle}>
      Cole um link de um post do Instagram. O Chefitu busca, monta a receita e salva na sua
      biblioteca.
    </DSText>

    <View style={styles.inputWrap}>
      <DSIcon name="Globe" size={18} color={COLORS.marromSoft} strokeWidth={1.75} />
      <TextInput
        value={url}
        onChangeText={onChangeUrl}
        placeholder="Cole o link aqui…"
        placeholderTextColor={COLORS.marromSoft}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        editable={!submitting}
        style={styles.input}
      />
    </View>

    <Pressable
      onPress={onSubmit}
      disabled={submitting || !url.trim()}
      style={[styles.primaryPill, (submitting || !url.trim()) && styles.disabled]}
    >
      <DSIcon name="Sparkles" size={18} color={COLORS.marrom} strokeWidth={2} />
      <DSText style={styles.primaryPillText}>{submitting ? "Importando…" : "Importar"}</DSText>
    </Pressable>
  </View>
);

const LoadingView = ({
  source,
  sourceUrl,
  stepIndex,
  percent,
}: {
  source: ImportSourceInfo;
  sourceUrl: string;
  stepIndex: number;
  percent: number;
}) => {
  const step = LOADING_STEPS[Math.min(stepIndex, LOADING_STEPS.length - 1)];

  return (
    <View style={styles.content}>
      <DSText variant="h2" style={styles.sheetTitle}>
        Importando receita
      </DSText>

      <View style={styles.loadingRow}>
        <View style={styles.potIcon}>
          <DSIcon name="CookingPot" size={22} color={COLORS.laranja} strokeWidth={2} />
        </View>
        <View style={styles.loadingTextCol}>
          <DSText style={styles.loadingStep}>{step}…</DSText>
        </View>
        <DSText style={styles.percent}>{Math.round(percent)}%</DSText>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.min(percent, 100)}%` }]} />
      </View>

      <SourceCard source={source} url={sourceUrl} />
    </View>
  );
};

const SuccessView = ({
  recipe,
  source,
  onViewRecipe,
}: {
  recipe: RecipeRecord;
  source: ImportSourceInfo;
  onViewRecipe: () => void;
}) => (
  <ImportResultLayout
    stickerId={IMPORT_FLOW_STICKER_BY_KIND.success}
    title="Receita pronta! 🎉"
    description={
      <DSText style={styles.resultDescription}>
        Transformei o link em <DSText style={styles.resultRecipeName}>{recipe.title}</DSText> e já
        guardei nas suas receitas.
      </DSText>
    }
    footer={
      <Pressable onPress={onViewRecipe} style={[styles.ctaOrange, styles.ctaFull]}>
        <DSText style={styles.ctaOrangeText}>Ver receita →</DSText>
      </Pressable>
    }
  >
    <RecipePreviewCard recipe={recipe} source={source} />
  </ImportResultLayout>
);

const ErrorView = ({
  variant,
  source,
  sourceUrl,
  busy,
  onDiscard,
  onRetry,
}: {
  variant: "no_recipe" | "failed";
  source: ImportSourceInfo;
  sourceUrl: string;
  busy: boolean;
  onDiscard: () => void;
  onRetry: () => void;
}) => {
  const isNoRecipe = variant === "no_recipe";

  return (
    <ImportResultLayout
      stickerId={
        IMPORT_FLOW_STICKER_BY_KIND[isNoRecipe ? "no_recipe" : "failed"]
      }
      title={isNoRecipe ? "Não achei receita nesse link" : "Algo deu errado"}
      description={
        isNoRecipe
          ? "Dei uma boa olhada, mas esse link não parece ter uma receita pra eu montar. Confira o endereço ou tente outro."
          : "Tive um probleminha ao importar essa receita. Pode ser a conexão ou o site. Quer tentar de novo?"
      }
      footer={
        <View style={styles.errorActions}>
          <Pressable
            onPress={onDiscard}
            disabled={busy}
            style={[styles.outlineBtn, busy && styles.disabled]}
          >
            <DSIcon name="Trash2" size={16} color={COLORS.marrom} strokeWidth={1.75} />
            <DSText style={styles.outlineBtnText}>Excluir</DSText>
          </Pressable>
          <Pressable
            onPress={onRetry}
            disabled={busy}
            style={[styles.ctaOrange, styles.errorRetry, busy && styles.disabled]}
          >
            <DSIcon name="RotateCw" size={16} color={COLORS.white} strokeWidth={2} />
            <DSText style={styles.ctaOrangeText}>Tentar de novo</DSText>
          </Pressable>
        </View>
      }
    >
      <SourceCard source={source} url={sourceUrl} compact />
    </ImportResultLayout>
  );
};

const RecipePreviewCard = ({
  recipe,
  source,
}: {
  recipe: RecipeRecord;
  source: ImportSourceInfo;
}) => (
  <View style={styles.recipePreview}>
    <Image
      source={{
        uri: resolveImageUrl(recipe.coverImageUrl) ?? FALLBACK_COVER_IMAGE,
      }}
      style={styles.previewImage}
    />
    <View style={styles.previewText}>
      <DSText style={styles.previewTitle} numberOfLines={2}>
        {recipe.title}
      </DSText>
      <View style={styles.previewMetaRow}>
        <View style={[styles.previewSourceIcon, { backgroundColor: source.iconBackground }]}>
          <ImportSourceIcon kind={source.kind} size={12} color={source.iconColor} />
        </View>
        <DSText style={styles.previewMeta}>
          {source.label}
          {recipe.totalTimeMinutes ? ` · ${recipe.totalTimeMinutes} min` : ""}
        </DSText>
      </View>
    </View>
  </View>
);

const SourceCard = ({
  source,
  url,
  compact = false,
}: {
  source: ImportSourceInfo;
  url: string;
  compact?: boolean;
}) => {
  const canOpen = url.trim().length > 0;

  const openLink = () => {
    if (canOpen) void Linking.openURL(url.trim());
  };

  return (
    <Pressable
      onPress={openLink}
      disabled={!canOpen}
      style={[styles.sourceCard, compact && styles.sourceCardCompact]}
      accessibilityRole="link"
      accessibilityLabel={`Abrir link: ${source.displayUrl}`}
    >
      <View style={[styles.sourceIcon, { backgroundColor: source.iconBackground }]}>
        <ImportSourceIcon kind={source.kind} size={18} color={source.iconColor} />
      </View>
      <View style={styles.sourceText}>
        <DSText style={[styles.sourceLabel, compact && styles.sourceLabelCompact]}>{source.label}</DSText>
        <DSText style={styles.sourceUrl} numberOfLines={1}>
          {source.displayUrl}
        </DSText>
      </View>
      {canOpen && <DSIcon name="ExternalLink" size={16} color={COLORS.marromSoft} strokeWidth={2} />}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
  },
  backdropSlot: {
    flex: 1,
  },
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
    minHeight: 320,
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
  primaryPillText: {
    fontFamily: FONTS.uiBold,
    fontWeight: "700",
    fontSize: 15,
    color: COLORS.marrom,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING[3],
  },
  potIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.laranjaSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingTextCol: {
    flex: 1,
    gap: 2,
  },
  loadingStep: {
    fontFamily: FONTS.uiBold,
    fontWeight: "700",
    fontSize: TYPE_SCALE.body,
    color: COLORS.marrom,
  },
  percent: {
    fontFamily: FONTS.uiBold,
    fontWeight: "700",
    fontSize: TYPE_SCALE.body,
    color: COLORS.laranja,
  },
  progressTrack: {
    height: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bege,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.laranja,
    borderRadius: RADIUS.pill,
  },
  resultDescription: {
    fontSize: TYPE_SCALE.body,
    lineHeight: TYPE_SCALE.body * 1.5,
    color: COLORS.marromSoft,
    textAlign: "center",
  },
  resultRecipeName: {
    fontFamily: FONTS.displayBold,
    fontWeight: "700",
    fontSize: TYPE_SCALE.body,
    color: COLORS.marrom,
  },
  recipePreview: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING[3],
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.input,
    padding: SPACING[3],
    borderWidth: 1,
    borderColor: OUTLINE,
  },
  previewImage: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bege,
  },
  previewText: {
    flex: 1,
    gap: 4,
  },
  previewTitle: {
    fontFamily: FONTS.displayBold,
    fontWeight: "700",
    fontSize: TYPE_SCALE.body,
    color: COLORS.marrom,
  },
  previewMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  previewSourceIcon: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  previewMeta: {
    fontSize: TYPE_SCALE.caption,
    color: COLORS.marromSoft,
    fontWeight: "600",
  },
  ctaFull: {
    alignSelf: "stretch",
    width: "100%",
  },
  ctaOrange: {
    backgroundColor: COLORS.laranja,
    borderRadius: RADIUS.pill,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: SPACING[2],
    ...SHADOWS.cta,
  },
  ctaOrangeText: {
    color: COLORS.white,
    fontFamily: FONTS.uiBold,
    fontWeight: "700",
    fontSize: 16,
  },
  sourceCard: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING[3],
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.input,
    padding: SPACING[3],
    borderWidth: 1,
    borderColor: OUTLINE,
  },
  sourceCardCompact: {
    width: "100%",
  },
  sourceIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  sourceText: {
    flex: 1,
    gap: 2,
  },
  sourceLabel: {
    fontFamily: FONTS.uiBold,
    fontWeight: "700",
    fontSize: TYPE_SCALE.bodySm,
    color: COLORS.marrom,
  },
  sourceLabelCompact: {
    fontFamily: FONTS.uiSemiBold,
    fontWeight: "600",
    color: COLORS.marromSoft,
  },
  sourceUrl: {
    fontSize: TYPE_SCALE.caption,
    color: COLORS.laranja,
    textDecorationLine: "underline",
  },
  errorActions: {
    alignSelf: "stretch",
    flexDirection: "row",
    gap: SPACING[3],
    width: "100%",
  },
  outlineBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING[2],
    paddingVertical: 14,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: OUTLINE,
    backgroundColor: COLORS.white,
  },
  outlineBtnText: {
    fontWeight: "600",
    color: COLORS.marrom,
    fontSize: 14,
  },
  errorRetry: {
    flex: 1.2,
  },
  disabled: {
    opacity: 0.5,
  },
});
