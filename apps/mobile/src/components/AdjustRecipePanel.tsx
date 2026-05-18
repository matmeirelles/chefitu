import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Dimensions,
  Easing,
  Keyboard,
  KeyboardEvent,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

const COMPOSER_MIN_HEIGHT = 24;
const COMPOSER_MAX_HEIGHT = 120;
const COMPOSER_BUTTON_SIZE = 40;
const COMPOSER_VERTICAL_PADDING = 24;
const COMPOSER_BASE_HEIGHT = 56;
const DRAG_CLOSE_THRESHOLD = 96;
const DRAG_HANDLE_HEIGHT = 44;
import type { ChatMessage, RecipeIngredient, RecipeRecord } from "@my-recipes/shared";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { adjustRecipe as adjustRecipeApi } from "../services/api";
import { COLORS, FONTS, RADIUS, SHADOWS, TYPE_SCALE } from "../design-system/tokens";
import { DSText } from "../design-system/Text";
import { DSIcon } from "../design-system/Icon";

const OUTLINE_VARIANT = "rgba(74, 44, 26, 0.10)";

// ─── Diff types ──────────────────────────────────────────────────────────────

type DiffItem =
  | { kind: "title_changed"; from: string; to: string }
  | { kind: "time_changed"; from: number | null; to: number | null }
  | { kind: "servings_changed"; from: string | null; to: string | null }
  | { kind: "ingredient_changed"; item: string; fromQty: string; toQty: string }
  | { kind: "ingredient_added"; item: string; qty: string }
  | { kind: "ingredient_removed"; item: string; qty: string }
  | { kind: "instructions_changed" };

const formatQty = (ing: RecipeIngredient) =>
  [ing.amount, ing.unit].filter(Boolean).join(" ") || "sem quantidade";

const computeDiff = (original: RecipeRecord, adjusted: RecipeRecord): DiffItem[] => {
  const items: DiffItem[] = [];

  if (original.title !== adjusted.title)
    items.push({ kind: "title_changed", from: original.title, to: adjusted.title });
  if (original.totalTimeMinutes !== adjusted.totalTimeMinutes)
    items.push({ kind: "time_changed", from: original.totalTimeMinutes ?? null, to: adjusted.totalTimeMinutes ?? null });
  if (original.servings !== adjusted.servings)
    items.push({ kind: "servings_changed", from: original.servings ?? null, to: adjusted.servings ?? null });

  const origMap = new Map(original.ingredients.map((i) => [i.item.toLowerCase(), i]));
  const adjMap = new Map(adjusted.ingredients.map((i) => [i.item.toLowerCase(), i]));

  for (const [key, origIng] of origMap) {
    const adjIng = adjMap.get(key);
    if (!adjIng) {
      items.push({ kind: "ingredient_removed", item: origIng.item, qty: formatQty(origIng) });
    } else {
      const fromQty = formatQty(origIng);
      const toQty = formatQty(adjIng);
      if (fromQty !== toQty)
        items.push({ kind: "ingredient_changed", item: origIng.item, fromQty, toQty });
    }
  }
  for (const [key, adjIng] of adjMap) {
    if (!origMap.has(key))
      items.push({ kind: "ingredient_added", item: adjIng.item, qty: formatQty(adjIng) });
  }

  const toStepJson = (r: RecipeRecord) => JSON.stringify(r.steps.map((s) => ({ order: s.order, title: s.title ?? null, instruction: s.instruction })));
  if (toStepJson(original) !== toStepJson(adjusted))
    items.push({ kind: "instructions_changed" });

  return items;
};

const formatDiffItem = (item: DiffItem): { label: string; color: "added" | "removed" | "changed" } => {
  switch (item.kind) {
    case "title_changed": return { label: `Título: "${item.from}" → "${item.to}"`, color: "changed" };
    case "time_changed": return { label: `Tempo: ${item.from ?? "—"} min → ${item.to ?? "—"} min`, color: "changed" };
    case "servings_changed": return { label: `Porções: ${item.from ?? "—"} → ${item.to ?? "—"}`, color: "changed" };
    case "ingredient_changed": return { label: `${item.item}: ${item.fromQty} → ${item.toQty}`, color: "changed" };
    case "ingredient_added": return { label: `+ ${item.item}${item.qty ? `: ${item.qty}` : ""}`, color: "added" };
    case "ingredient_removed": return { label: `- ${item.item}`, color: "removed" };
    case "instructions_changed": return { label: "Instruções da receita foram alteradas", color: "changed" };
  }
};

// ─── UI message types ─────────────────────────────────────────────────────────

export type UIMessage =
  | { id: string; kind: "user"; text: string }
  | { id: string; kind: "ai-message"; text: string }
  | { id: string; kind: "assistant"; adjustedRecipe: RecipeRecord; diff: DiffItem[]; applied: boolean }
  | { id: string; kind: "error"; text: string };

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  visible: boolean;
  onClose: () => void;
  recipeId: string;
  sessionId: string;
  originalRecipe: RecipeRecord;
  apiHistory: ChatMessage[];
  onApiHistoryChange: (h: ChatMessage[]) => void;
  uiMessages: UIMessage[];
  onUiMessagesChange: (m: UIMessage[]) => void;
  onApply: (adjusted: RecipeRecord) => void;
};

const SUGGESTIONS = ["Reduzir receita pela metade", "Não tenho todos os ingredientes", "Reduzir açúcar"];

// ─── Component ────────────────────────────────────────────────────────────────

export const AdjustRecipePanel = ({
  visible, onClose, recipeId, sessionId, originalRecipe,
  apiHistory, onApiHistoryChange, uiMessages, onUiMessagesChange, onApply,
}: Props) => {
  const insets = useSafeAreaInsets();
  const windowHeight = Dimensions.get("window").height;
  const baseSheetHeight = Math.min(windowHeight * 0.62, windowHeight - insets.top - 24);
  const [input, setInput] = useState("");
  const [composerHeight, setComposerHeight] = useState(COMPOSER_MIN_HEIGHT);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const keyboardAnim = useRef(new Animated.Value(0)).current;
  const sheetHeightAnim = useRef(new Animated.Value(baseSheetHeight)).current;
  const sheetHeightRef = useRef(baseSheetHeight);

  const focusComposer = () => inputRef.current?.focus();

  useEffect(() => {
    if (visible) { slideAnim.setValue(0); dragY.setValue(0); }
    if (!visible) return;
    Animated.timing(slideAnim, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(({ finished }) => {
      if (finished) focusComposer();
    });
  }, [visible, slideAnim, dragY]);

  useEffect(() => {
    if (visible) return;
    dragY.setValue(0);
    keyboardAnim.setValue(0);
    sheetHeightAnim.setValue(baseSheetHeight);
    sheetHeightRef.current = baseSheetHeight;
    setKeyboardVisible(false);
  }, [visible, dragY, keyboardAnim, sheetHeightAnim, baseSheetHeight]);

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => { onClose(); return true; });
    return () => sub.remove();
  }, [visible, onClose]);

  useEffect(() => {
    const computeTargetHeight = (kbHeight: number) => Math.min(baseSheetHeight, Math.max(windowHeight - insets.top - 24 - kbHeight, 0));
    const animateBoth = (kbTarget: number, heightTarget: number, duration: number) => {
      sheetHeightRef.current = heightTarget;
      Animated.parallel([
        Animated.timing(keyboardAnim, { toValue: kbTarget, duration, useNativeDriver: false }),
        Animated.timing(sheetHeightAnim, { toValue: heightTarget, duration, useNativeDriver: false }),
      ]).start();
    };
    const handleShow = (event: KeyboardEvent) => {
      const kbHeight = event.endCoordinates.height;
      const dur = Platform.OS === "ios" ? (event.duration ?? 250) : 200;
      setKeyboardVisible(true);
      animateBoth(kbHeight, computeTargetHeight(kbHeight), dur);
    };
    const handleHide = (event: KeyboardEvent) => {
      const dur = Platform.OS === "ios" ? (event.duration ?? 200) : 200;
      setKeyboardVisible(false);
      animateBoth(0, baseSheetHeight, dur);
    };
    const handleFrameChange = (event: KeyboardEvent) => {
      if (Platform.OS !== "ios") return;
      const kbHeight = Math.max(0, windowHeight - event.endCoordinates.screenY);
      keyboardAnim.setValue(kbHeight);
      sheetHeightAnim.setValue(computeTargetHeight(kbHeight));
    };
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, handleShow);
    const hideSub = Keyboard.addListener(hideEvent, handleHide);
    const frameSub = Platform.OS === "ios" ? Keyboard.addListener("keyboardWillChangeFrame", handleFrameChange) : null;
    return () => { showSub.remove(); hideSub.remove(); frameSub?.remove(); };
  }, [windowHeight, keyboardAnim]);

  useEffect(() => {
    if (!visible) return;
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 220);
  }, [visible, uiMessages.length]);

  const scrollToBottom = () => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);

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

    const isFirstMessage = apiHistory.length === 0;
    const recipeContext = { title: originalRecipe.title, category: originalRecipe.category, cuisine: originalRecipe.cuisine, ingredients: originalRecipe.ingredients, steps: originalRecipe.steps, totalTimeMinutes: originalRecipe.totalTimeMinutes, servings: originalRecipe.servings, tags: originalRecipe.tags };
    const userContent = isFirstMessage ? `Receita atual:\n${JSON.stringify(recipeContext, null, 2)}\n\nPedido: ${messageText}` : messageText;
    const newApiHistory: ChatMessage[] = [...apiHistory, { role: "user", content: userContent }];
    const newUiMessages: UIMessage[] = [...uiMessages, { id: Date.now().toString(), kind: "user", text: messageText }];

    onUiMessagesChange(newUiMessages);
    scrollToBottom();
    setLoading(true);

    try {
      const response = await adjustRecipeApi(recipeId, sessionId, newApiHistory);
      if (response.kind === "message") {
        onApiHistoryChange([...newApiHistory, { role: "assistant", content: response.message }]);
        onUiMessagesChange([...newUiMessages, { id: (Date.now() + 1).toString(), kind: "ai-message", text: response.message }]);
      } else {
        const diff = computeDiff(originalRecipe, response.adjustedRecipe);
        onApiHistoryChange([...newApiHistory, { role: "assistant", content: JSON.stringify(response.adjustedRecipe) }]);
        onUiMessagesChange([...newUiMessages, { id: (Date.now() + 1).toString(), kind: "assistant", adjustedRecipe: response.adjustedRecipe, diff, applied: false }]);
      }
    } catch (err) {
      onUiMessagesChange([...newUiMessages, { id: (Date.now() + 1).toString(), kind: "error", text: `Erro: ${err instanceof Error ? err.message : String(err)}` }]);
    } finally {
      setLoading(false);
      scrollToBottom();
      focusComposer();
    }
  };

  const handleApply = (msg: UIMessage & { kind: "assistant" }) => {
    onUiMessagesChange(uiMessages.map((m) => m.id === msg.id ? { ...m, applied: true } : m));
    onApply(msg.adjustedRecipe);
    onClose();
  };

  const slideY = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [windowHeight, 0] });
  const backdropOpacity = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const translateY = Animated.add(slideY, dragY);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 2 && Math.abs(g.dy) >= Math.abs(g.dx),
    onPanResponderGrant: () => dragY.stopAnimation(),
    onPanResponderMove: (_, g) => dragY.setValue(Math.max(0, g.dy)),
    onPanResponderRelease: (_, g) => {
      const shouldClose = g.dy > DRAG_CLOSE_THRESHOLD || (g.dy > 28 && g.vy > 1.05);
      if (shouldClose) {
        Keyboard.dismiss();
        Animated.timing(dragY, { toValue: sheetHeightRef.current, duration: 180, useNativeDriver: true }).start(() => onClose());
        return;
      }
      Animated.spring(dragY, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }).start();
    },
    onPanResponderTerminate: () => Animated.spring(dragY, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }).start(),
  })).current;

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropOpacity }]} />
        </Pressable>

        <Animated.View style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: keyboardAnim, backgroundColor: COLORS.creme }} />

        <Animated.View style={{ marginBottom: keyboardAnim, height: sheetHeightAnim }}>
          <Animated.View style={[styles.sheet, { flex: 1, backgroundColor: COLORS.creme, transform: [{ translateY }] }]}>
            <View {...panResponder.panHandlers} style={styles.dragHandleArea}>
              <View style={[styles.dragHandle, { backgroundColor: OUTLINE_VARIANT }]} />
            </View>

            <View style={[styles.header, { borderBottomColor: OUTLINE_VARIANT }]}>
              <View style={styles.headerLeft}>
                <DSIcon name="Sparkles" size={20} color={COLORS.laranja} strokeWidth={1.75} />
                <DSText style={styles.headerTitle}>Adaptar receita</DSText>
              </View>
              <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
                <DSIcon name="X" size={20} color={COLORS.marromSoft} strokeWidth={1.75} />
              </Pressable>
            </View>

            <ScrollView ref={scrollRef} style={styles.messageArea} contentContainerStyle={styles.messageContent} keyboardShouldPersistTaps="handled">
              {uiMessages.length === 0 ? (
                <View style={styles.suggestionsContainer}>
                  <DSText style={styles.suggestionsLabel}>Sugestões rápidas:</DSText>
                  {SUGGESTIONS.map((s) => (
                    <Pressable key={s} onPress={() => void handleSend(s)} style={styles.suggestionChip}>
                      <DSText style={{ color: COLORS.marrom, fontSize: TYPE_SCALE.body }}>{s}</DSText>
                    </Pressable>
                  ))}
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
                      <View key={msg.id} style={styles.aiBubbleRow}>
                        <View style={styles.aiBubble}>
                          {msg.diff.length === 0 ? (
                            <DSText style={{ color: COLORS.marromSoft, fontSize: TYPE_SCALE.bodySm }}>Nenhuma alteração detectada.</DSText>
                          ) : (
                            msg.diff.map((d, i) => {
                              const { label, color } = formatDiffItem(d);
                              const textColor = color === "added" ? "#1A7A3C" : color === "removed" ? COLORS.danger : COLORS.marrom;
                              return (
                                <DSText key={i} style={[styles.diffLine, { color: textColor }]}>{label}</DSText>
                              );
                            })
                          )}
                          {msg.applied ? (
                            <View style={styles.appliedRow}>
                              <DSIcon name="CheckCircle2" size={14} color={COLORS.marromSoft} strokeWidth={1.75} />
                              <DSText style={{ color: COLORS.marromSoft, fontSize: TYPE_SCALE.bodySm }}>Aplicado</DSText>
                            </View>
                          ) : (
                            <Pressable onPress={() => handleApply(msg)} style={styles.applyBtn}>
                              <DSText style={{ color: COLORS.white, fontWeight: "600", fontSize: TYPE_SCALE.bodySm }}>Aplicar</DSText>
                            </Pressable>
                          )}
                        </View>
                      </View>
                    );
                  })}
                  {loading && (
                    <View style={styles.aiBubbleRow}>
                      <View style={styles.aiBubble}>
                        <View style={styles.thinkingRow}>
                          <ActivityIndicator size="small" color={COLORS.marromSoft} />
                          <DSText style={{ color: COLORS.marromSoft, fontSize: TYPE_SCALE.bodySm }}>Pensando…</DSText>
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
                  onContentSizeChange={(event) => setComposerHeightFromContent(event.nativeEvent.contentSize.height)}
                  onSubmitEditing={() => void handleSend()}
                  placeholder="Digite seu ajuste…"
                  placeholderTextColor={COLORS.marromSoft}
                  returnKeyType="default"
                  blurOnSubmit={false}
                  autoFocus={false}
                  multiline
                  textAlignVertical="top"
                  scrollEnabled={composerHeight >= COMPOSER_MAX_HEIGHT - 1}
                  selectionColor={COLORS.laranja}
                  style={[styles.textInput, { color: COLORS.marrom, minHeight: composerHeight }]}
                  editable={!loading}
                />
                <Pressable onPress={() => void handleSend()} disabled={!input.trim() || loading} style={[styles.sendBtn, { opacity: !input.trim() || loading ? 0.4 : 1 }]}>
                  <DSIcon name="ArrowUp" size={18} color={COLORS.white} strokeWidth={2} />
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  backdrop: { backgroundColor: "rgba(0,0,0,0.2)" },
  sheet: { borderTopLeftRadius: RADIUS.sheet, borderTopRightRadius: RADIUS.sheet, ...SHADOWS.lg },
  dragHandleArea: { height: DRAG_HANDLE_HEIGHT, alignItems: "center", justifyContent: "center" },
  dragHandle: { width: 44, height: 4, borderRadius: RADIUS.pill },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontFamily: FONTS.displayBold, fontWeight: "700", fontSize: TYPE_SCALE.h3, color: COLORS.marrom },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  messageArea: { flex: 1 },
  messageContent: { paddingHorizontal: 20, paddingVertical: 16, gap: 12, flexGrow: 1 },
  suggestionsContainer: { gap: 10 },
  suggestionsLabel: { fontSize: TYPE_SCALE.bodySm, color: COLORS.marromSoft, marginBottom: 4 },
  suggestionChip: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: "rgba(74,44,26,0.14)", backgroundColor: COLORS.bege },
  userMsgRow: { alignItems: "flex-end" },
  userBubble: { maxWidth: "85%", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 18, borderBottomRightRadius: 4, backgroundColor: COLORS.laranja },
  aiBubbleRow: { alignItems: "flex-start" },
  aiBubble: { maxWidth: "90%", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 18, borderBottomLeftRadius: 4, gap: 4, backgroundColor: COLORS.bege },
  diffLine: { lineHeight: 20, fontSize: TYPE_SCALE.bodySm },
  appliedRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  applyBtn: { marginTop: 10, paddingVertical: 10, borderRadius: RADIUS.pill, alignItems: "center", backgroundColor: COLORS.laranja },
  thinkingRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  inputRow: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  inputWrap: { position: "relative", borderRadius: 28, overflow: "hidden", paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 12, minHeight: COMPOSER_BASE_HEIGHT, maxHeight: COMPOSER_MAX_HEIGHT + COMPOSER_VERTICAL_PADDING, backgroundColor: COLORS.bege },
  textInput: { width: "100%", fontFamily: FONTS.ui, fontSize: 15, lineHeight: 22, paddingTop: 0, paddingBottom: 0, paddingHorizontal: 0, paddingRight: COMPOSER_BUTTON_SIZE + 16, minHeight: COMPOSER_MIN_HEIGHT, maxHeight: COMPOSER_MAX_HEIGHT },
  sendBtn: { width: COMPOSER_BUTTON_SIZE, height: COMPOSER_BUTTON_SIZE, borderRadius: COMPOSER_BUTTON_SIZE / 2, alignItems: "center", justifyContent: "center", position: "absolute", right: 12, bottom: 8, backgroundColor: COLORS.laranja },
});
