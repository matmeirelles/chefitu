import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ChatMessage, GeneratedRecipeFields, GenerateRecipeResponse } from "@chefitu/shared";
import { generateRecipe as generateRecipeApi, saveGeneratedRecipe } from "../services/api";
import { appendAssistantMessage, appendUserMessage, buildSessionId } from "../utils/generate-chat";
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING, TYPE_SCALE } from "../design-system/tokens";
import { DSText } from "../design-system/Text";
import { DSIcon } from "../design-system/Icon";
import { useLocale } from "../i18n/LocaleContext";
import { InConstructionBottomSheet } from "../components/InConstructionBottomSheet";

const MASCOT = require("../../assets/mascot-symbol.png") as number;

const COMPOSER_MIN_HEIGHT = 24;
const COMPOSER_MAX_HEIGHT = 120;
const COMPOSER_BUTTON_SIZE = 40;
const COMPOSER_CAMERA_SIZE = 34;
const COMPOSER_VERTICAL_PADDING = 16;
const COMPOSER_BASE_HEIGHT = 56;
const MESSAGE_BOTTOM_GAP = 28;
const OUTLINE = "rgba(74, 44, 26, 0.12)";
/** Gap from the bottom of the tab content area (nav is outside AppShell content). */
const COMPOSER_FLOAT_GAP = 16;

export type UIMessage =
  | { id: string; kind: "user"; text: string }
  | { id: string; kind: "ai-message"; text: string }
  | { id: string; kind: "recipe"; recipe: GeneratedRecipeFields; saved: boolean }
  | { id: string; kind: "error"; text: string };

type Props = {
  apiHistory: ChatMessage[];
  onApiHistoryChange: (h: ChatMessage[]) => void;
  uiMessages: UIMessage[];
  onUiMessagesChange: (m: UIMessage[]) => void;
  sessionId: string;
  onSessionReset: () => void;
  onRecipeSaved: () => void;
};

type SuggestionItem = {
  icon: ComponentProps<typeof DSIcon>["name"];
  label: string;
  onPress: () => void;
};

const ChefituAvatar = ({ size = 36 }: { size?: number }) => (
  <View style={[avatarStyles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
    <Image source={MASCOT} style={{ width: size * 0.78, height: size * 0.78 }} resizeMode="contain" />
  </View>
);

const BotBubble = ({ children }: { children: ReactNode }) => (
  <View style={bubbleStyles.botRow}>
    <ChefituAvatar />
    <View style={bubbleStyles.botBubble}>{children}</View>
  </View>
);

// ─── Inline recipe card ──────────────────────────────────────────────────────

const GeneratedRecipeCard = ({
  recipe,
  saved,
  saving,
  expanded,
  onToggleDetails,
  onSave,
}: {
  recipe: GeneratedRecipeFields;
  saved: boolean;
  saving: boolean;
  expanded: boolean;
  onToggleDetails: () => void;
  onSave: () => void;
}) => {
  const previewIngredients = recipe.ingredients.slice(0, 3);
  const remaining = recipe.ingredients.length - previewIngredients.length;

  return (
    <View style={cardStyles.container}>
      <View style={cardStyles.heroRow}>
        <View style={cardStyles.thumb}>
          <DSText style={cardStyles.thumbEmoji} allowFontScaling={false}>
            🍽️
          </DSText>
        </View>
        <View style={cardStyles.heroText}>
          <DSText style={cardStyles.title} numberOfLines={2}>
            {recipe.title}
          </DSText>
          <View style={cardStyles.metaRow}>
            {recipe.totalTimeMinutes != null && (
              <DSText style={cardStyles.metaText}>{recipe.totalTimeMinutes} min</DSText>
            )}
            {recipe.servings ? <DSText style={cardStyles.metaText}>{recipe.servings}</DSText> : null}
          </View>
          {recipe.tags.length > 0 && (
            <View style={cardStyles.pillRow}>
              {recipe.tags.slice(0, 2).map((tag) => (
                <View key={tag} style={cardStyles.tagPill}>
                  <DSText style={cardStyles.tagText}>{tag}</DSText>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {(recipe.category || recipe.cuisine) && (
        <View style={cardStyles.pillRow}>
          {recipe.category && (
            <View style={[cardStyles.pill, { backgroundColor: COLORS.salvia }]}>
              <DSText style={cardStyles.pillLabel}>{recipe.category}</DSText>
            </View>
          )}
          {recipe.cuisine && (
            <View style={[cardStyles.pill, { backgroundColor: COLORS.bege }]}>
              <DSText style={cardStyles.pillLabel}>{recipe.cuisine}</DSText>
            </View>
          )}
        </View>
      )}

      {!expanded && previewIngredients.length > 0 && (
        <View style={cardStyles.ingredientsPreview}>
          {previewIngredients.map((ing, i) => (
            <DSText key={i} style={cardStyles.previewItem}>
              • {[ing.amount, ing.unit, ing.item].filter(Boolean).join(" ")}
            </DSText>
          ))}
          {remaining > 0 && (
            <DSText style={cardStyles.previewMore}>e mais {remaining} ingrediente{remaining !== 1 ? "s" : ""}…</DSText>
          )}
        </View>
      )}

      <View style={cardStyles.actionsRow}>
        <Pressable onPress={onToggleDetails} style={[cardStyles.detailsBtn, saved && cardStyles.fullWidthAction]}>
          <DSText style={cardStyles.detailsBtnText}>{expanded ? "Ocultar detalhes" : "Ver detalhes"}</DSText>
          <DSIcon name={expanded ? "ChevronUp" : "ChevronDown"} size={18} color={COLORS.laranja} strokeWidth={2} />
        </Pressable>

        {saved ? (
          <View style={cardStyles.savedRow}>
            <DSIcon name="CheckCircle2" size={16} color={COLORS.laranja} strokeWidth={1.75} />
            <DSText style={cardStyles.savedText}>Salvo na biblioteca</DSText>
          </View>
        ) : (
          <Pressable onPress={onSave} disabled={saving} style={[cardStyles.saveBtn, { opacity: saving ? 0.6 : 1 }]}>
            {saving ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <DSText style={cardStyles.saveBtnText}>Salvar receita</DSText>
            )}
          </Pressable>
        )}
      </View>

      {expanded && (
        <View style={cardStyles.detailsSection}>
          <View style={cardStyles.detailBlock}>
            <DSText style={cardStyles.sectionTitle}>Ingredientes</DSText>
            <View style={cardStyles.detailList}>
              {recipe.ingredients.map((ingredient, index) => (
                <View key={`${ingredient.item}-${index}`} style={cardStyles.detailRow}>
                  <DSText style={cardStyles.detailMain}>{ingredient.item}</DSText>
                  <DSText style={cardStyles.detailQty}>
                    {[ingredient.amount, ingredient.unit].filter(Boolean).join(" ")}
                  </DSText>
                </View>
              ))}
            </View>
          </View>

          <View style={cardStyles.detailBlock}>
            <DSText style={cardStyles.sectionTitle}>Modo de preparo</DSText>
            <View style={cardStyles.stepsList}>
              {recipe.steps.map((step) => (
                <View key={step.order} style={cardStyles.stepRow}>
                  <View style={cardStyles.stepBadge}>
                    <DSText style={cardStyles.stepBadgeText}>{step.order}</DSText>
                  </View>
                  <View style={cardStyles.stepContent}>
                    {step.title ? <DSText style={cardStyles.stepTitle}>{step.title}</DSText> : null}
                    <DSText style={cardStyles.stepInstruction}>{step.instruction}</DSText>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export const GenerateRecipeScreen = ({
  apiHistory,
  onApiHistoryChange,
  uiMessages,
  onUiMessagesChange,
  sessionId,
  onSessionReset,
  onRecipeSaved,
}: Props) => {
  const insets = useSafeAreaInsets();
  const { t } = useLocale();
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const [input, setInput] = useState("");
  const [composerHeight, setComposerHeight] = useState(COMPOSER_MIN_HEIGHT);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [expandedRecipeIds, setExpandedRecipeIds] = useState<string[]>([]);
  const [cameraSheetVisible, setCameraSheetVisible] = useState(false);

  const scrollToBottom = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
      scrollToBottom();
    });
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const setComposerHeightFromContent = (contentHeight: number) => {
    const h = Platform.OS === "android" ? contentHeight + 2 : contentHeight;
    const next = Math.min(COMPOSER_MAX_HEIGHT, Math.max(COMPOSER_MIN_HEIGHT, Math.ceil(h)));
    setComposerHeight((prev) => (prev === next ? prev : next));
  };

  const handleInputChange = (val: string) => {
    setInput(val);
    if (val.length === 0) setComposerHeight(COMPOSER_MIN_HEIGHT);
  };

  const handleSend = async (text?: string) => {
    const messageText = (text ?? input).trim();
    if (!messageText || loading) return;
    setInput("");
    setComposerHeight(COMPOSER_MIN_HEIGHT);
    Keyboard.dismiss();

    const newApiHistory = appendUserMessage(apiHistory, messageText);
    const newUiMessages: UIMessage[] = [...uiMessages, { id: `${Date.now()}`, kind: "user", text: messageText }];
    onApiHistoryChange(newApiHistory);
    onUiMessagesChange(newUiMessages);
    scrollToBottom();
    setLoading(true);

    let response: GenerateRecipeResponse;
    try {
      response = await generateRecipeApi(sessionId, newApiHistory);
    } catch (err) {
      onUiMessagesChange([
        ...newUiMessages,
        { id: `${Date.now() + 1}`, kind: "error", text: `Erro: ${err instanceof Error ? err.message : String(err)}` },
      ]);
      setLoading(false);
      scrollToBottom();
      return;
    }

    onApiHistoryChange(appendAssistantMessage(newApiHistory, response));

    if (response.kind === "message") {
      onUiMessagesChange([...newUiMessages, { id: `${Date.now() + 1}`, kind: "ai-message", text: response.message }]);
    } else {
      onUiMessagesChange([
        ...newUiMessages,
        { id: `${Date.now() + 1}`, kind: "recipe", recipe: response.recipe, saved: false },
      ]);
    }

    setLoading(false);
    scrollToBottom();
    inputRef.current?.focus();
  };

  const handleSave = async (msgId: string, recipe: GeneratedRecipeFields) => {
    setSavingId(msgId);
    try {
      await saveGeneratedRecipe(recipe);
      onUiMessagesChange(uiMessages.map((m) => (m.id === msgId && m.kind === "recipe" ? { ...m, saved: true } : m)));
      onRecipeSaved();
    } catch (err) {
      onUiMessagesChange([
        ...uiMessages,
        { id: `${Date.now()}`, kind: "error", text: `Erro ao salvar: ${err instanceof Error ? err.message : String(err)}` },
      ]);
    } finally {
      setSavingId(null);
    }
  };

  const handleReset = () => {
    onApiHistoryChange([]);
    onUiMessagesChange([]);
    setExpandedRecipeIds([]);
    setInput("");
    setComposerHeight(COMPOSER_MIN_HEIGHT);
    onSessionReset();
  };

  const confirmNewChat = () => {
    Alert.alert(t.chat.newChatTitle, t.chat.newChatBody, [
      { text: t.chat.newChatCancel, style: "cancel" },
      { text: t.chat.newChatConfirm, style: "destructive", onPress: handleReset },
    ]);
  };

  const handleToggleDetails = (messageId: string) => {
    setExpandedRecipeIds((curr) =>
      curr.includes(messageId) ? curr.filter((id) => id !== messageId) : [...curr, messageId],
    );
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 180);
  };

  const isEmpty = uiMessages.length === 0;
  const scrollBottomPad = COMPOSER_FLOAT_GAP + COMPOSER_BASE_HEIGHT + 24;

  const suggestions: SuggestionItem[] = [
    { icon: "Sparkles", label: t.chat.suggestions.pantry, onPress: () => void handleSend(t.chat.suggestions.pantry) },
    { icon: "Camera", label: t.chat.suggestions.photo, onPress: () => setCameraSheetVisible(true) },
    { icon: "Zap", label: t.chat.suggestions.quick, onPress: () => void handleSend(t.chat.suggestions.quick) },
    { icon: "Heart", label: t.chat.suggestions.dessert, onPress: () => void handleSend(t.chat.suggestions.dessert) },
  ];

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top, backgroundColor: COLORS.creme }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <View style={styles.headerProfile}>
          <View style={styles.headerAvatar}>
            <Image source={MASCOT} style={styles.headerMascot} resizeMode="contain" />
          </View>
          <View style={styles.headerText}>
            <DSText style={styles.headerTitle}>{t.nav.create}</DSText>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <DSText style={styles.statusLabel}>{t.chat.status}</DSText>
            </View>
          </View>
        </View>
        {!isEmpty && (
          <Pressable onPress={confirmNewChat} style={styles.moreBtn} hitSlop={8} accessibilityLabel={t.chat.newChatTitle}>
            <DSIcon name="MoreHorizontal" size={20} color={COLORS.marrom} strokeWidth={2} />
          </Pressable>
        )}
      </View>

      <View style={styles.chatBody}>
        <ScrollView
          ref={scrollRef}
          style={styles.messageArea}
          contentContainerStyle={[
            styles.messageContent,
            {
              paddingBottom: keyboardVisible
                ? MESSAGE_BOTTOM_GAP + COMPOSER_MAX_HEIGHT + 24
                : scrollBottomPad,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        >
          {isEmpty && (
            <>
              <BotBubble>
                <DSText style={bubbleStyles.botText}>{t.chat.welcome}</DSText>
              </BotBubble>
              <View style={styles.suggestionsWrap}>
                {suggestions.map((s) => (
                  <Pressable key={s.label} onPress={s.onPress} style={styles.suggestionBtn}>
                    <View style={styles.suggestionIconWrap}>
                      <DSIcon name={s.icon} size={15} color={COLORS.laranja} strokeWidth={2.2} />
                    </View>
                    <DSText style={styles.suggestionLabel}>{s.label}</DSText>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {uiMessages.map((msg) => {
            if (msg.kind === "user") {
              return (
                <View key={msg.id} style={styles.userMsgRow}>
                  <View style={styles.userBubble}>
                    <DSText style={styles.userBubbleText}>{msg.text}</DSText>
                  </View>
                </View>
              );
            }
            if (msg.kind === "ai-message") {
              return (
                <BotBubble key={msg.id}>
                  <DSText style={bubbleStyles.botText}>{msg.text}</DSText>
                </BotBubble>
              );
            }
            if (msg.kind === "error") {
              return (
                <BotBubble key={msg.id}>
                  <DSText style={[bubbleStyles.botText, { color: COLORS.danger }]}>{msg.text}</DSText>
                </BotBubble>
              );
            }
            return (
              <View key={msg.id} style={styles.recipeCardRow}>
                <GeneratedRecipeCard
                  recipe={msg.recipe}
                  saved={msg.saved}
                  saving={savingId === msg.id}
                  expanded={expandedRecipeIds.includes(msg.id)}
                  onToggleDetails={() => handleToggleDetails(msg.id)}
                  onSave={() => void handleSave(msg.id, msg.recipe)}
                />
              </View>
            );
          })}

          {loading && (
            <BotBubble>
              <View style={styles.thinkingRow}>
                <ActivityIndicator size="small" color={COLORS.marromSoft} />
                <DSText style={bubbleStyles.thinkingText}>{t.chat.thinking}</DSText>
              </View>
            </BotBubble>
          )}
        </ScrollView>

        <View
          style={[
            styles.composerFloat,
            { bottom: COMPOSER_FLOAT_GAP },
          ]}
          pointerEvents="box-none"
        >
          <View
            style={[
              styles.composerShell,
              { minHeight: Math.max(COMPOSER_BASE_HEIGHT, composerHeight + COMPOSER_VERTICAL_PADDING) },
            ]}
          >
            <Pressable
              onPress={() => setCameraSheetVisible(true)}
              style={styles.cameraBtn}
              accessibilityLabel={t.chat.suggestions.photo}
            >
              <DSIcon name="Camera" size={16} color={COLORS.marrom} strokeWidth={2.2} />
            </Pressable>
            <TextInput
              ref={inputRef}
              value={input}
              onChangeText={handleInputChange}
              onContentSizeChange={(e) => setComposerHeightFromContent(e.nativeEvent.contentSize.height)}
              onSubmitEditing={() => void handleSend()}
              onFocus={scrollToBottom}
              placeholder={t.chat.placeholder}
              placeholderTextColor={COLORS.marromSoft}
              returnKeyType="default"
              blurOnSubmit={false}
              multiline
              textAlignVertical="top"
              scrollEnabled={composerHeight >= COMPOSER_MAX_HEIGHT - 1}
              selectionColor={COLORS.laranja}
              style={[styles.textInput, { minHeight: composerHeight }]}
              editable={!loading}
            />
            <Pressable
              onPress={() => void handleSend()}
              disabled={!input.trim() || loading}
              style={[styles.sendBtn, { opacity: !input.trim() || loading ? 0.4 : 1 }]}
            >
              <DSIcon name="ArrowRight" size={18} color={COLORS.white} strokeWidth={2.6} />
            </Pressable>
          </View>
        </View>
      </View>

      <InConstructionBottomSheet visible={cameraSheetVisible} onDismiss={() => setCameraSheetVisible(false)} />
    </KeyboardAvoidingView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const avatarStyles = StyleSheet.create({
  circle: {
    backgroundColor: COLORS.laranja,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.cta,
  },
});

const bubbleStyles = StyleSheet.create({
  botRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, maxWidth: "100%" },
  botBubble: {
    flex: 1,
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  botText: { fontSize: TYPE_SCALE.body, lineHeight: TYPE_SCALE.body * 1.45, color: COLORS.marrom },
  thinkingText: { fontSize: TYPE_SCALE.bodySm, color: COLORS.marromSoft },
});

const cardStyles = StyleSheet.create({
  container: {
    maxWidth: "100%",
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: COLORS.bege,
    padding: 12,
    gap: 10,
    ...SHADOWS.sm,
  },
  heroRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 14,
    backgroundColor: COLORS.salvia,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  thumbEmoji: {
    fontSize: 28,
    lineHeight: 34,
    textAlign: "center",
    ...(Platform.OS === "android" ? { includeFontPadding: false } : null),
  },
  heroText: { flex: 1, minWidth: 0, gap: 4 },
  title: { fontFamily: FONTS.displayBold, fontWeight: "700", fontSize: 14, color: COLORS.marrom, lineHeight: 16 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metaText: { fontSize: 11, fontWeight: "600", color: COLORS.marromSoft },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tagPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.pill, backgroundColor: COLORS.laranjaSoft },
  tagText: { fontSize: 11, fontWeight: "700", color: COLORS.marrom },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.pill },
  pillLabel: { fontSize: 11, fontWeight: "700", color: COLORS.marrom },
  ingredientsPreview: { gap: 2 },
  previewItem: { fontSize: TYPE_SCALE.bodySm, color: COLORS.marrom },
  previewMore: { fontSize: TYPE_SCALE.bodySm, color: COLORS.marromSoft },
  actionsRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  detailsBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: RADIUS.pill,
    borderWidth: 2,
    borderColor: COLORS.laranja,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 14,
  },
  detailsBtnText: { color: COLORS.laranja, fontWeight: "700", fontSize: TYPE_SCALE.bodySm },
  saveBtn: {
    flex: 1,
    minHeight: 46,
    paddingVertical: 12,
    borderRadius: RADIUS.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.laranja,
    ...SHADOWS.cta,
  },
  saveBtnText: { color: COLORS.white, fontWeight: "700", fontSize: TYPE_SCALE.bodySm },
  savedRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, flex: 1, minHeight: 46 },
  savedText: { color: COLORS.laranja, fontWeight: "700", fontSize: TYPE_SCALE.bodySm },
  fullWidthAction: { flex: 1 },
  detailsSection: { marginTop: 2, paddingTop: 14, gap: 18, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: OUTLINE },
  detailBlock: { gap: 10 },
  sectionTitle: {
    fontFamily: FONTS.uiBold,
    fontWeight: "700",
    fontSize: TYPE_SCALE.caption,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    color: COLORS.marrom,
  },
  detailList: { gap: 8 },
  detailRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  detailMain: { flex: 1, fontSize: TYPE_SCALE.bodySm, color: COLORS.marrom },
  detailQty: { fontSize: TYPE_SCALE.bodySm, color: COLORS.marromSoft },
  stepsList: { gap: 12 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.salvia,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  stepBadgeText: { color: COLORS.marrom, fontWeight: "700", fontSize: 12 },
  stepContent: { flex: 1, gap: 2 },
  stepTitle: { fontFamily: FONTS.uiBold, fontWeight: "700", fontSize: TYPE_SCALE.bodySm, color: COLORS.marrom },
  stepInstruction: { color: COLORS.marromSoft, fontSize: TYPE_SCALE.bodySm, lineHeight: 20 },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING[4],
    paddingTop: SPACING[2],
    paddingBottom: 12,
    gap: 12,
    overflow: "visible",
  },
  headerProfile: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.laranja,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.cta,
  },
  headerMascot: { width: 34, height: 34 },
  headerText: { flex: 1, gap: 3 },
  headerTitle: {
    fontFamily: FONTS.displayBold,
    fontWeight: "700",
    fontSize: 17,
    lineHeight: 24,
    color: COLORS.marrom,
  },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.verdeFolha },
  statusLabel: { fontSize: 11, fontWeight: "600", color: COLORS.marromSoft },
  moreBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  chatBody: { flex: 1, position: "relative" },
  messageArea: { flex: 1 },
  messageContent: { paddingHorizontal: SPACING[4], paddingTop: 8, paddingBottom: SPACING[4], gap: 14 },
  suggestionsWrap: { paddingLeft: 44, gap: 8 },
  suggestionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.bege,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    ...SHADOWS.sm,
  },
  suggestionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.laranjaSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionLabel: { flex: 1, fontFamily: FONTS.uiSemiBold, fontWeight: "600", fontSize: 13, color: COLORS.marrom },
  userMsgRow: { alignItems: "flex-end" },
  userBubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomRightRadius: 6,
    backgroundColor: COLORS.laranja,
    ...SHADOWS.sm,
  },
  userBubbleText: { color: COLORS.white, fontSize: TYPE_SCALE.body, lineHeight: TYPE_SCALE.body * 1.4 },
  recipeCardRow: { paddingLeft: 44 },
  thinkingRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  composerFloat: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 10,
  },
  composerShell: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING[2],
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: OUTLINE,
    paddingLeft: 10,
    paddingRight: 10,
    paddingVertical: 8,
    ...SHADOWS.lg,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.34,
    shadowRadius: 24,
    elevation: 16,
  },
  cameraBtn: {
    width: COMPOSER_CAMERA_SIZE,
    height: COMPOSER_CAMERA_SIZE,
    borderRadius: COMPOSER_CAMERA_SIZE / 2,
    backgroundColor: COLORS.bege,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  textInput: {
    flex: 1,
    fontFamily: FONTS.ui,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.marrom,
    paddingTop: Platform.OS === "ios" ? 8 : 6,
    paddingBottom: Platform.OS === "ios" ? 8 : 6,
    maxHeight: COMPOSER_MAX_HEIGHT,
  },
  sendBtn: {
    width: COMPOSER_BUTTON_SIZE,
    height: COMPOSER_BUTTON_SIZE,
    borderRadius: COMPOSER_BUTTON_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.laranja,
    flexShrink: 0,
    ...SHADOWS.cta,
  },
});
