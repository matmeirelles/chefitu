import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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

const COMPOSER_MIN_HEIGHT = 24;
const COMPOSER_MAX_HEIGHT = 120;
const COMPOSER_BUTTON_SIZE = 40;
const COMPOSER_VERTICAL_PADDING = 24;
const COMPOSER_BASE_HEIGHT = 56;
const MESSAGE_BOTTOM_GAP = 28;
const OUTLINE_VARIANT = "rgba(74, 44, 26, 0.10)";
const OUTLINE = "rgba(74, 44, 26, 0.14)";

const SUGGESTIONS = [
  "Risotto de cogumelos para 4 pessoas",
  "Bolo de chocolate simples",
  "Frango grelhado com legumes",
  "Algo rápido com poucos ingredientes",
];

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
      <DSText style={cardStyles.title}>{recipe.title}</DSText>

      {(recipe.category || recipe.cuisine) && (
        <View style={cardStyles.pillRow}>
          {recipe.category && (
            <View style={[cardStyles.pill, { backgroundColor: COLORS.salvia }]}>
              <DSText style={{ color: COLORS.marrom, fontSize: 11, fontWeight: "700" }}>{recipe.category}</DSText>
            </View>
          )}
          {recipe.cuisine && (
            <View style={[cardStyles.pill, { backgroundColor: COLORS.bege }]}>
              <DSText style={{ color: COLORS.marrom, fontSize: 11, fontWeight: "700" }}>{recipe.cuisine}</DSText>
            </View>
          )}
        </View>
      )}

      <View style={cardStyles.metricsRow}>
        {recipe.totalTimeMinutes != null && (
          <View style={cardStyles.metric}>
            <DSIcon name="Clock" size={14} color={COLORS.marromSoft} strokeWidth={1.75} />
            <DSText style={cardStyles.metricText}>{recipe.totalTimeMinutes} min</DSText>
          </View>
        )}
        {recipe.servings && (
          <View style={cardStyles.metric}>
            <DSIcon name="Users" size={14} color={COLORS.marromSoft} strokeWidth={1.75} />
            <DSText style={cardStyles.metricText}>{recipe.servings}</DSText>
          </View>
        )}
        {recipe.ingredients.length > 0 && (
          <View style={cardStyles.metric}>
            <DSIcon name="List" size={14} color={COLORS.marromSoft} strokeWidth={1.75} />
            <DSText style={cardStyles.metricText}>{recipe.ingredients.length} ingredientes</DSText>
          </View>
        )}
      </View>

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
          <DSText style={{ color: COLORS.laranja, fontWeight: "700", fontSize: TYPE_SCALE.bodySm }}>
            {expanded ? "Ocultar detalhes" : "Ver detalhes"}
          </DSText>
          <DSIcon name={expanded ? "ChevronUp" : "ChevronDown"} size={18} color={COLORS.laranja} strokeWidth={2} />
        </Pressable>

        {saved ? (
          <View style={cardStyles.savedRow}>
            <DSIcon name="CheckCircle2" size={16} color={COLORS.laranja} strokeWidth={1.75} />
            <DSText style={{ color: COLORS.laranja, fontWeight: "700", fontSize: TYPE_SCALE.bodySm }}>Salvo na biblioteca</DSText>
          </View>
        ) : (
          <Pressable onPress={onSave} disabled={saving} style={[cardStyles.saveBtn, { opacity: saving ? 0.6 : 1 }]}>
            {saving ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <DSText style={{ color: COLORS.white, fontWeight: "700", fontSize: TYPE_SCALE.bodySm }}>Salvar receita</DSText>
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
                  <DSText style={{ color: COLORS.marromSoft, fontSize: TYPE_SCALE.bodySm }}>
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
                    <DSText style={{ color: COLORS.marrom, fontWeight: "700", fontSize: 12 }}>{step.order}</DSText>
                  </View>
                  <View style={cardStyles.stepContent}>
                    {step.title ? <DSText style={cardStyles.stepTitle}>{step.title}</DSText> : null}
                    <DSText style={{ color: COLORS.marromSoft, fontSize: TYPE_SCALE.bodySm, lineHeight: 20 }}>
                      {step.instruction}
                    </DSText>
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
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const [input, setInput] = useState("");
  const [composerHeight, setComposerHeight] = useState(COMPOSER_MIN_HEIGHT);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [expandedRecipeIds, setExpandedRecipeIds] = useState<string[]>([]);

  const scrollToBottom = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, () => { setKeyboardVisible(true); scrollToBottom(); });
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => { showSub.remove(); hideSub.remove(); };
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
      onUiMessagesChange([...newUiMessages, { id: `${Date.now() + 1}`, kind: "error", text: `Erro: ${err instanceof Error ? err.message : String(err)}` }]);
      setLoading(false);
      scrollToBottom();
      return;
    }

    onApiHistoryChange(appendAssistantMessage(newApiHistory, response));

    if (response.kind === "message") {
      onUiMessagesChange([...newUiMessages, { id: `${Date.now() + 1}`, kind: "ai-message", text: response.message }]);
    } else {
      onUiMessagesChange([...newUiMessages, { id: `${Date.now() + 1}`, kind: "recipe", recipe: response.recipe, saved: false }]);
    }

    setLoading(false);
    scrollToBottom();
    inputRef.current?.focus();
  };

  const handleSave = async (msgId: string, recipe: GeneratedRecipeFields) => {
    setSavingId(msgId);
    try {
      await saveGeneratedRecipe(recipe);
      onUiMessagesChange(uiMessages.map((m) => m.id === msgId && m.kind === "recipe" ? { ...m, saved: true } : m));
      onRecipeSaved();
    } catch (err) {
      onUiMessagesChange([...uiMessages, { id: `${Date.now()}`, kind: "error", text: `Erro ao salvar: ${err instanceof Error ? err.message : String(err)}` }]);
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

  const handleToggleDetails = (messageId: string) => {
    setExpandedRecipeIds((curr) => curr.includes(messageId) ? curr.filter((id) => id !== messageId) : [...curr, messageId]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 180);
  };

  const isEmpty = uiMessages.length === 0;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top, backgroundColor: COLORS.creme }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.header, { borderBottomColor: OUTLINE_VARIANT }]}>
        <View style={styles.headerLeft}>
          <DSIcon name="Sparkles" size={20} color={COLORS.laranja} strokeWidth={1.75} />
          <DSText style={styles.headerTitle}>Criar receita</DSText>
        </View>
        {!isEmpty && (
          <Pressable onPress={handleReset} style={styles.resetBtn} hitSlop={8}>
            <DSIcon name="RefreshCw" size={20} color={COLORS.marromSoft} strokeWidth={1.75} />
          </Pressable>
        )}
      </View>

      <View style={styles.chatBody}>
        <ScrollView
          ref={scrollRef}
          style={styles.messageArea}
          contentContainerStyle={[styles.messageContent, isEmpty && styles.emptyContent, { paddingBottom: keyboardVisible ? MESSAGE_BOTTOM_GAP + 12 : MESSAGE_BOTTOM_GAP }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        >
          {isEmpty ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <DSIcon name="Sparkles" size={32} color={COLORS.laranja} strokeWidth={1.75} />
              </View>
              <DSText style={styles.emptyTitle}>Criar receita</DSText>
              <DSText style={styles.emptySubtitle}>
                Descreva o prato que você quer cozinhar e eu crio a receita completa para você.
              </DSText>
              <View style={styles.suggestions}>
                {SUGGESTIONS.map((s) => (
                  <Pressable key={s} onPress={() => void handleSend(s)} style={styles.suggestionChip}>
                    <DSText style={{ color: COLORS.marrom, fontSize: TYPE_SCALE.body }}>{s}</DSText>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            <>
              {uiMessages.map((msg) => {
                if (msg.kind === "user") {
                  return (
                    <View key={msg.id} style={styles.userMsgRow}>
                      <View style={styles.userBubble}>
                        <DSText style={{ color: COLORS.white, fontSize: TYPE_SCALE.body }}>{msg.text}</DSText>
                      </View>
                    </View>
                  );
                }
                if (msg.kind === "ai-message") {
                  return (
                    <View key={msg.id} style={styles.aiBubbleRow}>
                      <View style={styles.aiBubble}>
                        <DSText style={{ color: COLORS.marrom, fontSize: TYPE_SCALE.body }}>{msg.text}</DSText>
                      </View>
                    </View>
                  );
                }
                if (msg.kind === "error") {
                  return (
                    <View key={msg.id} style={styles.aiBubbleRow}>
                      <View style={[styles.aiBubble, { backgroundColor: COLORS.dangerBg }]}>
                        <DSText style={{ color: COLORS.danger, fontSize: TYPE_SCALE.body }}>{msg.text}</DSText>
                      </View>
                    </View>
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
                <View style={styles.aiBubbleRow}>
                  <View style={styles.aiBubble}>
                    <View style={styles.thinkingRow}>
                      <ActivityIndicator size="small" color={COLORS.marromSoft} />
                      <DSText style={{ color: COLORS.marromSoft, fontSize: TYPE_SCALE.bodySm }}>Criando receita…</DSText>
                    </View>
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>

        <View style={[styles.inputRow, { borderTopColor: OUTLINE_VARIANT, paddingBottom: keyboardVisible ? 8 : insets.bottom + 8, backgroundColor: COLORS.creme }]}>
          <View style={[styles.inputWrap, { minHeight: Math.max(COMPOSER_BASE_HEIGHT, composerHeight + COMPOSER_VERTICAL_PADDING) }]}>
            <TextInput
              ref={inputRef}
              value={input}
              onChangeText={handleInputChange}
              onContentSizeChange={(e) => setComposerHeightFromContent(e.nativeEvent.contentSize.height)}
              onSubmitEditing={() => void handleSend()}
              onFocus={scrollToBottom}
              placeholder="Descreva a receita que você quer criar…"
              placeholderTextColor={COLORS.marromSoft}
              returnKeyType="default"
              blurOnSubmit={false}
              multiline
              textAlignVertical="top"
              scrollEnabled={composerHeight >= COMPOSER_MAX_HEIGHT - 1}
              selectionColor={COLORS.laranja}
              style={[styles.textInput, { color: COLORS.marrom, minHeight: composerHeight }]}
              editable={!loading}
            />
            <Pressable
              onPress={() => void handleSend()}
              disabled={!input.trim() || loading}
              style={[styles.sendBtn, { opacity: !input.trim() || loading ? 0.4 : 1 }]}
            >
              <DSIcon name="ArrowUp" size={18} color={COLORS.white} strokeWidth={2} />
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

// ─── Card styles ─────────────────────────────────────────────────────────────

const cardStyles = StyleSheet.create({
  container: { borderRadius: 18, borderBottomLeftRadius: 4, padding: 16, gap: 10, maxWidth: "90%", backgroundColor: COLORS.bege },
  title: { fontFamily: FONTS.displayBold, fontWeight: "700", fontSize: TYPE_SCALE.h3, color: COLORS.marrom },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.pill },
  metricsRow: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  metric: { flexDirection: "row", alignItems: "center", gap: 4 },
  metricText: { fontSize: TYPE_SCALE.bodySm, color: COLORS.marromSoft },
  ingredientsPreview: { gap: 2 },
  previewItem: { fontSize: TYPE_SCALE.bodySm, color: COLORS.marrom },
  previewMore: { fontSize: TYPE_SCALE.bodySm, color: COLORS.marromSoft },
  actionsRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  detailsBtn: { flex: 1, minHeight: 46, borderRadius: RADIUS.pill, borderWidth: 2, borderColor: COLORS.laranja, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 14 },
  saveBtn: { flex: 1, minHeight: 46, paddingVertical: 12, borderRadius: RADIUS.pill, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.laranja, ...SHADOWS.cta },
  savedRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, flex: 1, minHeight: 46, paddingVertical: 8 },
  fullWidthAction: { flex: 1 },
  detailsSection: { marginTop: 2, paddingTop: 14, gap: 18, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: OUTLINE_VARIANT },
  detailBlock: { gap: 10 },
  sectionTitle: { fontFamily: FONTS.uiBold, fontWeight: "700", fontSize: TYPE_SCALE.caption, textTransform: "uppercase", letterSpacing: 0.4, color: COLORS.marrom },
  detailList: { gap: 8 },
  detailRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  detailMain: { flex: 1, fontSize: TYPE_SCALE.bodySm, color: COLORS.marrom },
  stepsList: { gap: 12 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  stepBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.salvia, alignItems: "center", justifyContent: "center", marginTop: 2 },
  stepContent: { flex: 1, gap: 2 },
  stepTitle: { fontFamily: FONTS.uiBold, fontWeight: "700", fontSize: TYPE_SCALE.bodySm, color: COLORS.marrom },
});

// ─── Screen styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: SPACING[5], paddingVertical: SPACING[4], borderBottomWidth: StyleSheet.hairlineWidth },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: SPACING[2] },
  headerTitle: { fontFamily: FONTS.displayBold, fontWeight: "700", fontSize: TYPE_SCALE.h3, color: COLORS.marrom },
  chatBody: { flex: 1 },
  resetBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  messageArea: { flex: 1 },
  messageContent: { paddingHorizontal: SPACING[5], paddingVertical: SPACING[4], gap: 12, flexGrow: 1 },
  emptyContent: { justifyContent: "center" },
  emptyState: { alignItems: "center", gap: 12, paddingVertical: SPACING[6] },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.laranjaSoft, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyTitle: { fontFamily: FONTS.displayBold, fontWeight: "700", fontSize: TYPE_SCALE.h2, color: COLORS.marrom, textAlign: "center" },
  emptySubtitle: { textAlign: "center", maxWidth: 280, lineHeight: 22, fontSize: TYPE_SCALE.body, color: COLORS.marromSoft },
  suggestions: { marginTop: SPACING[2], gap: SPACING[2], width: "100%" },
  suggestionChip: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: OUTLINE, backgroundColor: COLORS.bege },
  userMsgRow: { alignItems: "flex-end" },
  userBubble: { maxWidth: "85%", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 18, borderBottomRightRadius: 4, backgroundColor: COLORS.laranja },
  aiBubbleRow: { alignItems: "flex-start" },
  aiBubble: { maxWidth: "90%", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 18, borderBottomLeftRadius: 4, gap: 4, backgroundColor: COLORS.bege },
  recipeCardRow: { alignItems: "flex-start" },
  thinkingRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  inputRow: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  inputWrap: { position: "relative", borderRadius: 28, overflow: "hidden", paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 12, minHeight: COMPOSER_BASE_HEIGHT, maxHeight: COMPOSER_MAX_HEIGHT + COMPOSER_VERTICAL_PADDING, backgroundColor: COLORS.bege },
  textInput: { width: "100%", fontFamily: FONTS.ui, fontSize: 15, lineHeight: 22, paddingTop: 0, paddingBottom: 0, paddingHorizontal: 0, paddingRight: COMPOSER_BUTTON_SIZE + 16, minHeight: COMPOSER_MIN_HEIGHT, maxHeight: COMPOSER_MAX_HEIGHT },
  sendBtn: { width: COMPOSER_BUTTON_SIZE, height: COMPOSER_BUTTON_SIZE, borderRadius: COMPOSER_BUTTON_SIZE / 2, alignItems: "center", justifyContent: "center", position: "absolute", right: 12, bottom: 8, backgroundColor: COLORS.laranja },
});
