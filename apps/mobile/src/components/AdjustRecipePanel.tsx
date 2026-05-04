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
import { Icon, Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { adjustRecipe as adjustRecipeApi } from "../services/api";

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

  if (original.title !== adjusted.title) {
    items.push({ kind: "title_changed", from: original.title, to: adjusted.title });
  }
  if (original.totalTimeMinutes !== adjusted.totalTimeMinutes) {
    items.push({
      kind: "time_changed",
      from: original.totalTimeMinutes ?? null,
      to: adjusted.totalTimeMinutes ?? null,
    });
  }
  if (original.servings !== adjusted.servings) {
    items.push({ kind: "servings_changed", from: original.servings ?? null, to: adjusted.servings ?? null });
  }

  const origMap = new Map(original.ingredients.map((i) => [i.item.toLowerCase(), i]));
  const adjMap = new Map(adjusted.ingredients.map((i) => [i.item.toLowerCase(), i]));

  for (const [key, origIng] of origMap) {
    const adjIng = adjMap.get(key);
    if (!adjIng) {
      items.push({ kind: "ingredient_removed", item: origIng.item, qty: formatQty(origIng) });
    } else {
      const fromQty = formatQty(origIng);
      const toQty = formatQty(adjIng);
      if (fromQty !== toQty) {
        items.push({ kind: "ingredient_changed", item: origIng.item, fromQty, toQty });
      }
    }
  }
  for (const [key, adjIng] of adjMap) {
    if (!origMap.has(key)) {
      items.push({ kind: "ingredient_added", item: adjIng.item, qty: formatQty(adjIng) });
    }
  }

  const originalSteps = JSON.stringify(
    original.steps.map((step) => ({
      order: step.order,
      title: step.title ?? null,
      instruction: step.instruction,
    })),
  );
  const adjustedSteps = JSON.stringify(
    adjusted.steps.map((step) => ({
      order: step.order,
      title: step.title ?? null,
      instruction: step.instruction,
    })),
  );

  if (originalSteps !== adjustedSteps) {
    items.push({ kind: "instructions_changed" });
  }

  return items;
};

const formatDiffItem = (item: DiffItem): { label: string; color: "added" | "removed" | "changed" } => {
  switch (item.kind) {
    case "title_changed":
      return { label: `Título: "${item.from}" → "${item.to}"`, color: "changed" };
    case "time_changed":
      return {
        label: `Tempo: ${item.from ?? "—"} min → ${item.to ?? "—"} min`,
        color: "changed",
      };
    case "servings_changed":
      return { label: `Porções: ${item.from ?? "—"} → ${item.to ?? "—"}`, color: "changed" };
    case "ingredient_changed":
      return { label: `${item.item}: ${item.fromQty} → ${item.toQty}`, color: "changed" };
    case "ingredient_added":
      return { label: `+ ${item.item}${item.qty ? `: ${item.qty}` : ""}`, color: "added" };
    case "ingredient_removed":
      return { label: `- ${item.item}`, color: "removed" };
    case "instructions_changed":
      return { label: "Instruções da receita foram alteradas", color: "changed" };
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

const SUGGESTIONS = [
  "Reduzir receita pela metade",
  "Não tenho todos os ingredientes",
  "Reduzir açúcar",
];

// ─── Component ────────────────────────────────────────────────────────────────

export const AdjustRecipePanel = ({
  visible,
  onClose,
  recipeId,
  sessionId,
  originalRecipe,
  apiHistory,
  onApiHistoryChange,
  uiMessages,
  onUiMessagesChange,
  onApply,
}: Props) => {
  const theme = useTheme();
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
  // Track current height as a plain number for the drag-close animation toValue
  const sheetHeightRef = useRef(baseSheetHeight);

  const focusComposer = () => inputRef.current?.focus();

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(0);
      dragY.setValue(0);
    }
    if (!visible) return;
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      focusComposer();
    });
  }, [visible, slideAnim, dragY]);

  useEffect(() => {
    if (visible) return;
    // Avoid one-frame flash when closing by drag.
    dragY.setValue(0);
    keyboardAnim.setValue(0);
    sheetHeightAnim.setValue(baseSheetHeight);
    sheetHeightRef.current = baseSheetHeight;
    setKeyboardVisible(false);
  }, [visible, dragY, keyboardAnim, sheetHeightAnim, baseSheetHeight]);

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  useEffect(() => {
    const computeTargetHeight = (kbHeight: number) => {
      const maxH = windowHeight - insets.top - 24 - kbHeight;
      return Math.min(baseSheetHeight, Math.max(maxH, 0));
    };

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
      // Interactive keyboard dismiss: set directly to track finger without animation
      const kbHeight = Math.max(0, windowHeight - event.endCoordinates.screenY);
      keyboardAnim.setValue(kbHeight);
      sheetHeightAnim.setValue(computeTargetHeight(kbHeight));
    };

    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, handleShow);
    const hideSub = Keyboard.addListener(hideEvent, handleHide);
    const frameSub =
      Platform.OS === "ios"
        ? Keyboard.addListener("keyboardWillChangeFrame", handleFrameChange)
        : null;

    return () => {
      showSub.remove();
      hideSub.remove();
      frameSub?.remove();
    };
  }, [windowHeight, keyboardAnim]);

  useEffect(() => {
    if (!visible) return;
    // Keep focus on latest messages when reopening existing chat history.
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 220);
  }, [visible, uiMessages.length]);

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  };

  const setComposerHeightFromContent = (contentHeight: number) => {
    const normalizedContentHeight = Platform.OS === "android" ? contentHeight + 2 : contentHeight;
    const nextHeight = Math.min(
      COMPOSER_MAX_HEIGHT,
      Math.max(COMPOSER_MIN_HEIGHT, Math.ceil(normalizedContentHeight)),
    );
    setComposerHeight((prev) => (prev === nextHeight ? prev : nextHeight));
  };

  const handleInputChange = (nextValue: string) => {
    setInput(nextValue);
    if (nextValue.length === 0) {
      setComposerHeight(COMPOSER_MIN_HEIGHT);
    }
  };

  const handleSend = async (text?: string) => {
    const messageText = (text ?? input).trim();
    if (!messageText || loading) return;

    setInput("");
    setComposerHeight(COMPOSER_MIN_HEIGHT);
    Keyboard.dismiss();

    const isFirstMessage = apiHistory.length === 0;
    const recipeContext = {
      title: originalRecipe.title,
      category: originalRecipe.category,
      cuisine: originalRecipe.cuisine,
      ingredients: originalRecipe.ingredients,
      steps: originalRecipe.steps,
      totalTimeMinutes: originalRecipe.totalTimeMinutes,
      servings: originalRecipe.servings,
      tags: originalRecipe.tags,
    };
    const userContent = isFirstMessage
      ? `Receita atual:\n${JSON.stringify(recipeContext, null, 2)}\n\nPedido: ${messageText}`
      : messageText;

    const newApiHistory: ChatMessage[] = [...apiHistory, { role: "user", content: userContent }];

    const newUiMessages: UIMessage[] = [
      ...uiMessages,
      { id: Date.now().toString(), kind: "user", text: messageText },
    ];
    onUiMessagesChange(newUiMessages);
    scrollToBottom();
    setLoading(true);

    try {
      const response = await adjustRecipeApi(recipeId, sessionId, newApiHistory);

      if (response.kind === "message") {
        onApiHistoryChange([...newApiHistory, { role: "assistant", content: response.message }]);
        onUiMessagesChange([
          ...newUiMessages,
          { id: (Date.now() + 1).toString(), kind: "ai-message", text: response.message },
        ]);
      } else {
        const diff = computeDiff(originalRecipe, response.adjustedRecipe);
        onApiHistoryChange([
          ...newApiHistory,
          { role: "assistant", content: JSON.stringify(response.adjustedRecipe) },
        ]);
        onUiMessagesChange([
          ...newUiMessages,
          {
            id: (Date.now() + 1).toString(),
            kind: "assistant",
            adjustedRecipe: response.adjustedRecipe,
            diff,
            applied: false,
          },
        ]);
      }
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      onUiMessagesChange([
        ...newUiMessages,
        {
          id: (Date.now() + 1).toString(),
          kind: "error",
          text: `Erro: ${detail}`,
        },
      ]);
    } finally {
      setLoading(false);
      scrollToBottom();
      focusComposer();
    }
  };

  const handleApply = (msg: UIMessage & { kind: "assistant" }) => {
    const updated = uiMessages.map((m) =>
      m.id === msg.id ? { ...m, applied: true } : m,
    );
    onUiMessagesChange(updated);
    onApply(msg.adjustedRecipe);
    onClose();
  };

  const slideY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [windowHeight, 0],
  });

  const backdropOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const translateY = Animated.add(slideY, dragY);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dy) > 2 && Math.abs(gesture.dy) >= Math.abs(gesture.dx),
      onPanResponderGrant: () => {
        dragY.stopAnimation();
      },
      onPanResponderMove: (_, gesture) => {
        dragY.setValue(Math.max(0, gesture.dy));
      },
      onPanResponderRelease: (_, gesture) => {
        const shouldClose =
          gesture.dy > DRAG_CLOSE_THRESHOLD || (gesture.dy > 28 && gesture.vy > 1.05);
        if (shouldClose) {
          Keyboard.dismiss();
          Animated.timing(dragY, {
            toValue: sheetHeightRef.current,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            onClose();
          });
          return;
        }
        Animated.spring(dragY, {
          toValue: 0,
          tension: 80,
          friction: 12,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(dragY, {
          toValue: 0,
          tension: 80,
          friction: 12,
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        {/* Backdrop */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropOpacity }]} />
        </Pressable>

        {/* Filler: prevents backdrop from showing in the gap between sheet bottom and keyboard */}
        <Animated.View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: keyboardAnim,
            backgroundColor: theme.colors.surface,
          }}
        />

        {/* Sheet anchored to bottom */}
        {/* Outer view: JS driver only — marginBottom + height can't use native driver */}
        <Animated.View style={{ marginBottom: keyboardAnim, height: sheetHeightAnim }}>
        {/* Inner view: native driver only — transform: translateY for slide-in + drag */}
        <Animated.View
          style={[
            styles.sheet,
            {
              flex: 1,
              backgroundColor: theme.colors.surface,
              transform: [{ translateY }],
            },
          ]}
        >
            <View {...panResponder.panHandlers} style={styles.dragHandleArea}>
              <View
                style={[
                  styles.dragHandle,
                  { backgroundColor: theme.colors.outlineVariant },
                ]}
              />
            </View>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.colors.outlineVariant }]}>
              <View style={styles.headerLeft}>
                <Icon source="auto-fix" size={20} color={theme.colors.primary} />
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                  Adjust recipe
                </Text>
              </View>
              <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
                <Icon source="close" size={20} color={theme.colors.onSurfaceVariant} />
              </Pressable>
            </View>

            {/* Messages / Suggestions */}
            <ScrollView
              ref={scrollRef}
              style={styles.messageArea}
              contentContainerStyle={styles.messageContent}
              keyboardShouldPersistTaps="handled"
            >
              {uiMessages.length === 0 ? (
                <View style={styles.suggestionsContainer}>
                  <Text
                    variant="bodySmall"
                    style={[styles.suggestionsLabel, { color: theme.colors.onSurfaceVariant }]}
                  >
                    Quick suggestions:
                  </Text>
                  {SUGGESTIONS.map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => void handleSend(s)}
                      style={[
                        styles.suggestionChip,
                        { borderColor: theme.colors.outline, backgroundColor: theme.colors.surfaceVariant },
                      ]}
                    >
                      <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                        {s}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <>
                  {uiMessages.map((msg) => {
                    if (msg.kind === "user") {
                      return (
                        <View key={msg.id} style={styles.userMsgRow}>
                          <View style={[styles.userBubble, { backgroundColor: theme.colors.primary }]}>
                            <Text variant="bodyMedium" style={{ color: theme.colors.onPrimary }}>
                              {msg.text}
                            </Text>
                          </View>
                        </View>
                      );
                    }
                    if (msg.kind === "ai-message") {
                      return (
                        <View key={msg.id} style={styles.aiBubbleRow}>
                          <View style={[styles.aiBubble, { backgroundColor: theme.colors.surfaceVariant }]}>
                            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                              {msg.text}
                            </Text>
                          </View>
                        </View>
                      );
                    }
                    if (msg.kind === "error") {
                      return (
                        <View key={msg.id} style={styles.aiBubbleRow}>
                          <View
                            style={[
                              styles.aiBubble,
                              { backgroundColor: theme.colors.errorContainer },
                            ]}
                          >
                            <Text variant="bodyMedium" style={{ color: theme.colors.onErrorContainer }}>
                              {msg.text}
                            </Text>
                          </View>
                        </View>
                      );
                    }
                    // assistant diff
                    return (
                      <View key={msg.id} style={styles.aiBubbleRow}>
                        <View
                          style={[styles.aiBubble, { backgroundColor: theme.colors.surfaceVariant }]}
                        >
                          {msg.diff.length === 0 ? (
                            <Text
                              variant="bodyMedium"
                              style={{ color: theme.colors.onSurfaceVariant }}
                            >
                              Nenhuma alteração detectada.
                            </Text>
                          ) : (
                            msg.diff.map((d, i) => {
                              const { label, color } = formatDiffItem(d);
                              const textColor =
                                color === "added"
                                  ? "#1A7A3C"
                                  : color === "removed"
                                    ? "#B3261E"
                                    : theme.colors.onSurface;
                              return (
                                <Text
                                  key={i}
                                  variant="bodySmall"
                                  style={[styles.diffLine, { color: textColor }]}
                                >
                                  {label}
                                </Text>
                              );
                            })
                          )}

                          {msg.applied ? (
                            <View style={styles.appliedRow}>
                              <Icon
                                source="check-circle"
                                size={14}
                                color={theme.colors.onSurfaceVariant}
                              />
                              <Text
                                variant="bodySmall"
                                style={{ color: theme.colors.onSurfaceVariant }}
                              >
                                Aplicado
                              </Text>
                            </View>
                          ) : (
                            <Pressable
                              onPress={() => handleApply(msg)}
                              style={[
                                styles.applyBtn,
                                { backgroundColor: theme.colors.primary },
                              ]}
                            >
                              <Text
                                variant="labelLarge"
                                style={{ color: theme.colors.onPrimary }}
                              >
                                Apply
                              </Text>
                            </Pressable>
                          )}
                        </View>
                      </View>
                    );
                  })}

                  {loading && (
                    <View style={styles.aiBubbleRow}>
                      <View
                        style={[styles.aiBubble, { backgroundColor: theme.colors.surfaceVariant }]}
                      >
                        <View style={styles.thinkingRow}>
                          <ActivityIndicator size="small" color={theme.colors.onSurfaceVariant} />
                          <Text
                            variant="bodySmall"
                            style={{ color: theme.colors.onSurfaceVariant }}
                          >
                            Thinking...
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </>
              )}
            </ScrollView>

            {/* Input */}
            <View
              style={[
                styles.inputRow,
                {
                  borderTopColor: theme.colors.outlineVariant,
                  paddingBottom: keyboardVisible ? 8 : insets.bottom + 8,
                  backgroundColor: theme.colors.surface,
                },
              ]}
            >
              <View
                style={[
                  styles.inputWrap,
                  {
                    backgroundColor: theme.colors.surfaceVariant,
                    minHeight: Math.max(COMPOSER_BASE_HEIGHT, composerHeight + COMPOSER_VERTICAL_PADDING),
                  },
                ]}
              >
                <TextInput
                  ref={inputRef}
                  value={input}
                  onChangeText={handleInputChange}
                  onContentSizeChange={(event) =>
                    setComposerHeightFromContent(event.nativeEvent.contentSize.height)
                  }
                  onSubmitEditing={() => void handleSend()}
                  placeholder="Type your adjustment..."
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  returnKeyType="default"
                  blurOnSubmit={false}
                  autoFocus={false}
                  multiline
                  textAlignVertical="top"
                  scrollEnabled={composerHeight >= COMPOSER_MAX_HEIGHT - 1}
                  selectionColor={theme.colors.primary}
                  style={[
                    styles.textInput,
                    {
                      color: theme.colors.onSurface,
                      minHeight: composerHeight,
                    },
                  ]}
                  editable={!loading}
                />
                <Pressable
                  onPress={() => void handleSend()}
                  disabled={!input.trim() || loading}
                  style={[
                    styles.sendBtn,
                    {
                      backgroundColor: theme.colors.primary,
                      opacity: !input.trim() || loading ? 0.4 : 1,
                    },
                  ]}
                >
                  <Icon source="arrow-up" size={18} color={theme.colors.onPrimary} />
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
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 16,
  },
  dragHandleArea: {
    height: DRAG_HANDLE_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  dragHandle: {
    width: 44,
    height: 4,
    borderRadius: 999,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  messageArea: {
    flex: 1,
  },
  messageContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    flexGrow: 1,
  },
  suggestionsContainer: {
    gap: 10,
  },
  suggestionsLabel: {
    marginBottom: 4,
  },
  suggestionChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  userMsgRow: {
    alignItems: "flex-end",
  },
  userBubble: {
    maxWidth: "85%",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomRightRadius: 4,
  },
  aiBubbleRow: {
    alignItems: "flex-start",
  },
  aiBubble: {
    maxWidth: "90%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    gap: 4,
  },
  diffLine: {
    lineHeight: 20,
  },
  appliedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  applyBtn: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
  },
  thinkingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  inputRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputWrap: {
    position: "relative",
    borderRadius: 28,
    overflow: "hidden",
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: COMPOSER_BASE_HEIGHT,
    maxHeight: COMPOSER_MAX_HEIGHT + COMPOSER_VERTICAL_PADDING,
  },
  textInput: {
    width: "100%",
    fontSize: 15,
    lineHeight: 22,
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
    paddingRight: COMPOSER_BUTTON_SIZE + 16,
    minHeight: COMPOSER_MIN_HEIGHT,
    maxHeight: COMPOSER_MAX_HEIGHT,
  },
  sendBtn: {
    width: COMPOSER_BUTTON_SIZE,
    height: COMPOSER_BUTTON_SIZE,
    borderRadius: COMPOSER_BUTTON_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    right: 12,
    bottom: 8,
  },
});
