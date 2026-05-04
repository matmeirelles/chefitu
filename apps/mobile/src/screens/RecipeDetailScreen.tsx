import { useEffect, useRef, useState } from "react";
import { Alert, Animated, Image, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import type { ChatMessage, RecipeIngredient, RecipeRecord, RecipeStep } from "@my-recipes/shared";
import { Icon, Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AdjustRecipePanel, type UIMessage } from "../components/AdjustRecipePanel";
import { MetricCard } from "../components/MetricCard";
import { FALLBACK_COVER_IMAGE } from "../constants";
import { deleteRecipe, saveNewRecipe, updateRecipe } from "../services/api";

type DetailTab = "ingredients" | "instructions";

const createAdjustmentSessionId = (recipeId: string) =>
  `adj_${recipeId}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

export const RecipeDetailScreen = ({
  recipe,
  onBack,
  onDelete,
}: {
  recipe: RecipeRecord;
  onBack: () => void;
  onDelete: () => void;
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  // ── Base UI state ──────────────────────────────────────────────────────────
  const [currentRecipe, setCurrentRecipe] = useState(recipe);
  const [activeTab, setActiveTab] = useState<DetailTab>("ingredients");
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuAnim = useRef(new Animated.Value(0)).current;

  // ── Adjust state ───────────────────────────────────────────────────────────
  const [panelOpen, setPanelOpen] = useState(false);
  const [adjustmentSessionId] = useState(() => createAdjustmentSessionId(recipe.id));
  const [apiHistory, setApiHistory] = useState<ChatMessage[]>([]);
  const [uiMessages, setUiMessages] = useState<UIMessage[]>([]);
  const [appliedRecipe, setAppliedRecipe] = useState<RecipeRecord | null>(null);
  const [viewingOriginal, setViewingOriginal] = useState(false);

  // ── Dialog state ───────────────────────────────────────────────────────────
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  const hasAdjustment = appliedRecipe !== null;
  const displayedRecipe = hasAdjustment && !viewingOriginal ? appliedRecipe : currentRecipe;
  const hasHistory = uiMessages.some((m) => m.kind === "user");

  useEffect(() => {
    setCurrentRecipe(recipe);
  }, [recipe]);

  // ── Menu animation ─────────────────────────────────────────────────────────
  const openMenu = () => {
    setMenuOpen(true);
    Animated.timing(menuAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
  };
  const closeMenu = () => {
    Animated.timing(menuAnim, { toValue: 0, duration: 100, useNativeDriver: true }).start(() =>
      setMenuOpen(false),
    );
  };

  const handleDeletePress = () => {
    closeMenu();
    setTimeout(() => setConfirmDelete(true), 120);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteRecipe(recipe.id);
      setConfirmDelete(false);
      onDelete();
    } catch {
      setDeleting(false);
      Alert.alert("Não foi possível deletar", "Tente novamente.");
    }
  };

  const toggleIngredient = (index: number) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  // ── Back handling ──────────────────────────────────────────────────────────
  const handleBack = () => {
    if (hasAdjustment) {
      setShowUnsavedWarning(true);
    } else {
      onBack();
    }
  };

  // ── Adjust apply ───────────────────────────────────────────────────────────
  const handleApply = (adjusted: RecipeRecord) => {
    setAppliedRecipe(adjusted);
    setViewingOriginal(false);
    setCheckedIngredients(new Set());
  };

  // ── Save handlers ──────────────────────────────────────────────────────────
  const handleSaveOverwrite = async () => {
    if (!appliedRecipe) return;
    setSaving(true);
    try {
      const updatedRecipe = await updateRecipe(recipe.id, {
        title: appliedRecipe.title,
        category: appliedRecipe.category,
        cuisine: appliedRecipe.cuisine,
        ingredients: appliedRecipe.ingredients,
        steps: appliedRecipe.steps,
        totalTimeMinutes: appliedRecipe.totalTimeMinutes,
        servings: appliedRecipe.servings,
        tags: appliedRecipe.tags,
      });
      setCurrentRecipe(updatedRecipe);
      setShowSaveDialog(false);
      setAppliedRecipe(null);
      setUiMessages([]);
      setApiHistory([]);
      setViewingOriginal(false);
    } catch {
      Alert.alert("Erro ao salvar", "Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsNew = async () => {
    if (!appliedRecipe) return;
    setSaving(true);
    try {
      await saveNewRecipe({
        sourceRecipeId: recipe.id,
        title: appliedRecipe.title,
        coverImageUrl: appliedRecipe.coverImageUrl,
        category: appliedRecipe.category,
        cuisine: appliedRecipe.cuisine,
        ingredients: appliedRecipe.ingredients,
        steps: appliedRecipe.steps,
        totalTimeMinutes: appliedRecipe.totalTimeMinutes,
        servings: appliedRecipe.servings,
        tags: appliedRecipe.tags,
      });
      setShowSaveDialog(false);
      setAppliedRecipe(null);
      setUiMessages([]);
      setApiHistory([]);
      setViewingOriginal(false);
    } catch {
      Alert.alert("Erro ao salvar", "Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Hero */}
        <View>
          <Image
            source={{ uri: displayedRecipe.coverImageUrl ?? FALLBACK_COVER_IMAGE }}
            style={styles.heroImage}
          />
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <View style={[styles.heroNav, { top: insets.top + 8 }]}>
              <Pressable onPress={handleBack} style={styles.glassBtn}>
                <Icon source="arrow-left" size={22} color="#221A16" />
              </Pressable>
              <View style={styles.heroNavRight}>
                <Pressable style={styles.glassBtn}>
                  <Icon source="bookmark-outline" size={20} color="#221A16" />
                </Pressable>
                <Pressable style={styles.glassBtn}>
                  <Icon source="share-variant-outline" size={20} color="#221A16" />
                </Pressable>
                <View>
                  <Pressable style={styles.glassBtn} onPress={menuOpen ? closeMenu : openMenu}>
                    <Icon source="dots-vertical" size={20} color="#221A16" />
                  </Pressable>
                  {menuOpen && (
                    <Animated.View
                      style={[
                        styles.dropdownMenu,
                        {
                          opacity: menuAnim,
                          transform: [
                            {
                              scale: menuAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.9, 1],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      <Pressable style={styles.menuItem} onPress={handleDeletePress}>
                        <Icon source="trash-can-outline" size={18} color="#B3261E" />
                        <Text style={styles.menuItemText}>Deletar</Text>
                      </Pressable>
                    </Animated.View>
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Body card */}
        <View style={[styles.detailBody, { backgroundColor: theme.colors.surface }]}>
          {/* Adjusted indicator */}
          {hasAdjustment && (
            <View style={[styles.adjustedBadge, { backgroundColor: theme.colors.primaryContainer }]}>
              <Icon source="auto-fix" size={14} color={theme.colors.onPrimaryContainer} />
              <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer, fontWeight: "500" }}>
                {viewingOriginal ? "Visualizando original" : "Receita ajustada"}
              </Text>
            </View>
          )}

          {/* Eyebrow */}
          {(displayedRecipe.category || displayedRecipe.cuisine) && (
            <Text style={[styles.eyebrow, { color: theme.colors.primary }]}>
              {[displayedRecipe.category, displayedRecipe.cuisine]
                .filter(Boolean)
                .join(" · ")
                .toUpperCase()}
            </Text>
          )}

          {/* Title */}
          <Text
            variant="headlineSmall"
            style={[styles.detailTitle, { color: theme.colors.onSurface }]}
          >
            {displayedRecipe.title}
          </Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            <MetricCard value={displayedRecipe.totalTimeMinutes?.toString() ?? "—"} label="Min" />
            <MetricCard value={displayedRecipe.servings?.split(" ")[0] ?? "—"} label="Servings" />
            <MetricCard
              value={displayedRecipe.ingredients.length.toString()}
              label="Items"
            />
          </View>

          {/* Segmented control */}
          <View style={[styles.segmented, { borderColor: theme.colors.outline }]}>
            {(["ingredients", "instructions"] as DetailTab[]).map((tab) => {
              const active = activeTab === tab;
              return (
                <Pressable key={tab} onPress={() => setActiveTab(tab)} style={styles.segmentTab}>
                  <View
                    style={[
                      styles.segmentPill,
                      active && { backgroundColor: theme.colors.secondaryContainer },
                    ]}
                  >
                    {active && (
                      <Icon source="check" size={15} color={theme.colors.onSecondaryContainer} />
                    )}
                    <Text
                      variant="labelLarge"
                      style={{
                        color: active
                          ? theme.colors.onSecondaryContainer
                          : theme.colors.onSurface,
                      }}
                    >
                      {tab === "ingredients" ? "Ingredients" : "Instructions"}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Section heading */}
          <View style={styles.sectionHeading}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
              {activeTab === "ingredients" ? "Ingredients" : "Instructions"}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {activeTab === "ingredients"
                ? `For ${displayedRecipe.servings ?? "your recipe"}`
                : `${displayedRecipe.steps.length} steps`}
            </Text>
          </View>

          {/* Content */}
          {activeTab === "ingredients"
            ? displayedRecipe.ingredients.map((ingredient, index) => (
                <IngredientRow
                  key={`${displayedRecipe.id}-ing-${index}`}
                  ingredient={ingredient}
                  isLast={index === displayedRecipe.ingredients.length - 1}
                  checked={checkedIngredients.has(index)}
                  onToggle={() => toggleIngredient(index)}
                />
              ))
            : displayedRecipe.steps.map((step, index) => (
                <StepRow
                  key={`${displayedRecipe.id}-step-${step.order}`}
                  step={step}
                  isLast={index === displayedRecipe.steps.length - 1}
                />
              ))}
        </View>
      </ScrollView>

      {/* ── Bottom bar ──────────────────────────────────────────────────────── */}
      {hasAdjustment ? (
        <View
          style={[
            styles.adjustedBar,
            {
              bottom: insets.bottom + 8,
              borderColor: theme.colors.outlineVariant,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          {/* Original / Adjusted toggle */}
          <View style={[styles.versionToggle, { borderColor: theme.colors.outline }]}>
            <Pressable
              onPress={() => {
                setViewingOriginal(true);
                setCheckedIngredients(new Set());
              }}
              style={[
                styles.toggleOption,
                viewingOriginal && { backgroundColor: theme.colors.secondaryContainer },
              ]}
            >
              <Text
                variant="labelSmall"
                style={{
                  color: viewingOriginal
                    ? theme.colors.onSecondaryContainer
                    : theme.colors.onSurfaceVariant,
                  fontWeight: "500",
                }}
              >
                Original
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setViewingOriginal(false);
                setCheckedIngredients(new Set());
              }}
              style={[
                styles.toggleOption,
                !viewingOriginal && { backgroundColor: theme.colors.secondaryContainer },
              ]}
            >
              <Text
                variant="labelSmall"
                style={{
                  color: !viewingOriginal
                    ? theme.colors.onSecondaryContainer
                    : theme.colors.onSurfaceVariant,
                  fontWeight: "500",
                }}
              >
                Adjusted
              </Text>
            </Pressable>
          </View>

          {/* Continue adjusting */}
          <Pressable
            onPress={() => setPanelOpen(true)}
            style={[styles.adjustMoreBtn, { borderColor: theme.colors.outline }]}
          >
            <Icon source="auto-fix" size={14} color={theme.colors.primary} />
            <Text variant="labelSmall" style={{ color: theme.colors.onSurface, fontWeight: "500" }}>
              Adjust more
            </Text>
          </Pressable>

          {/* Save */}
          <Pressable
            onPress={() => setShowSaveDialog(true)}
            style={[styles.saveBtn, { backgroundColor: theme.colors.primary }]}
          >
            <Text variant="labelSmall" style={{ color: theme.colors.onPrimary, fontWeight: "600" }}>
              Save
            </Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => setPanelOpen(true)}
          style={[
            styles.aiBar,
            { bottom: insets.bottom + 16, backgroundColor: theme.colors.surfaceVariant },
          ]}
        >
          <Icon source="auto-fix" size={hasHistory ? 20 : 20} color={theme.colors.primary} />
          <Text
            variant="bodyLarge"
            style={{ flex: 1, color: hasHistory ? theme.colors.onSurface : theme.colors.onSurfaceVariant, fontWeight: hasHistory ? "500" : "400" }}
            numberOfLines={1}
          >
            {hasHistory ? "Continue adjusting..." : "Adjust this recipe…"}
          </Text>
          {hasHistory ? (
            <View style={[styles.historyBadge, { backgroundColor: theme.colors.primary }]}>
              <Text variant="labelSmall" style={{ color: theme.colors.onPrimary, fontWeight: "700", fontSize: 11 }}>
                {uiMessages.filter((m) => m.kind === "user").length}
              </Text>
            </View>
          ) : (
            <View style={[styles.aiSendBtn, { backgroundColor: theme.colors.primary }]}>
              <Icon source="arrow-up" size={20} color={theme.colors.onPrimary} />
            </View>
          )}
        </Pressable>
      )}

      {/* ── Adjust chat panel ────────────────────────────────────────────────── */}
          <AdjustRecipePanel
            visible={panelOpen}
            onClose={() => setPanelOpen(false)}
            recipeId={recipe.id}
            sessionId={adjustmentSessionId}
            originalRecipe={recipe}
            apiHistory={apiHistory}
            onApiHistoryChange={setApiHistory}
        uiMessages={uiMessages}
        onUiMessagesChange={setUiMessages}
        onApply={handleApply}
      />

      {/* ── Delete confirmation ──────────────────────────────────────────────── */}
      <Modal
        visible={confirmDelete}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmDelete(false)}
      >
        <View style={styles.dialogOverlay}>
          <View style={[styles.dialogBox, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.dialogTitle, { color: theme.colors.onSurface }]}>
              Deletar receita?
            </Text>
            <Text style={[styles.dialogBody, { color: theme.colors.onSurfaceVariant }]}>
              Isso vai remover permanentemente{" "}
              <Text style={{ fontWeight: "700", color: theme.colors.onSurface }}>
                {recipe.title}
              </Text>{" "}
              da sua biblioteca. Essa ação não pode ser desfeita.
            </Text>
            <View style={styles.dialogActions}>
              <Pressable
                style={[styles.dialogCancelBtn, { borderColor: theme.colors.outline }]}
                onPress={() => setConfirmDelete(false)}
                disabled={deleting}
              >
                <Text style={{ color: theme.colors.onSurface, fontWeight: "500" }}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.dialogDeleteBtn, { opacity: deleting ? 0.6 : 1 }]}
                onPress={() => void handleConfirmDelete()}
                disabled={deleting}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>
                  {deleting ? "Deletando…" : "Deletar"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Unsaved changes warning ──────────────────────────────────────────── */}
      <Modal
        visible={showUnsavedWarning}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUnsavedWarning(false)}
      >
        <View style={styles.dialogOverlay}>
          <View style={[styles.dialogBox, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.dialogTitle, { color: theme.colors.onSurface }]}>
              Sair sem salvar?
            </Text>
            <Text style={[styles.dialogBody, { color: theme.colors.onSurfaceVariant }]}>
              Se você sair, perderá os ajustes realizados na receita.
            </Text>
            <View style={styles.dialogActions}>
              <Pressable
                style={[styles.dialogCancelBtn, { borderColor: theme.colors.outline }]}
                onPress={() => setShowUnsavedWarning(false)}
              >
                <Text style={{ color: theme.colors.onSurface, fontWeight: "500" }}>Voltar</Text>
              </Pressable>
              <Pressable
                style={[styles.dialogDeleteBtn, { backgroundColor: theme.colors.error }]}
                onPress={() => {
                  setShowUnsavedWarning(false);
                  onBack();
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>Sair</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Save dialog ──────────────────────────────────────────────────────── */}
      <Modal
        visible={showSaveDialog}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSaveDialog(false)}
      >
        <View style={styles.dialogOverlay}>
          <View style={[styles.dialogBox, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.dialogTitle, { color: theme.colors.onSurface }]}>
              Salvar receita ajustada
            </Text>
            <Text style={[styles.dialogBody, { color: theme.colors.onSurfaceVariant }]}>
              Como você quer salvar essa receita?
            </Text>
            <View style={[styles.dialogActions, { flexDirection: "column" }]}>
              <Pressable
                style={[
                  styles.dialogSecondaryBtn,
                  { borderColor: theme.colors.outline, opacity: saving ? 0.6 : 1 },
                ]}
                onPress={() => void handleSaveOverwrite()}
                disabled={saving}
              >
                <Text style={[styles.dialogSecondaryBtnText, { color: theme.colors.onSurface }]}>
                  Replace original
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.dialogSaveNewBtn,
                  { backgroundColor: theme.colors.primary, opacity: saving ? 0.6 : 1 },
                ]}
                onPress={() => void handleSaveAsNew()}
                disabled={saving}
              >
                <Text style={{ color: theme.colors.onPrimary, fontWeight: "600" }}>
                  Salvar como nova receita
                </Text>
              </Pressable>
            </View>
            <Pressable
              style={styles.dialogCancelText}
              onPress={() => setShowSaveDialog(false)}
              disabled={saving}
            >
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant, textAlign: "center" }}
              >
                Cancelar
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const IngredientRow = ({
  ingredient,
  isLast,
  checked,
  onToggle,
}: {
  ingredient: RecipeIngredient;
  isLast: boolean;
  checked: boolean;
  onToggle: () => void;
}) => {
  const theme = useTheme();
  const qty = [ingredient.amount, ingredient.unit].filter(Boolean).join(" ");

  return (
    <Pressable onPress={onToggle}>
      <View
        style={[
          styles.ingredientRow,
          !isLast && { borderBottomWidth: 1, borderBottomColor: theme.colors.surfaceVariant },
        ]}
      >
        <View
          style={[
            styles.checkbox,
            {
              borderColor: checked ? theme.colors.primary : theme.colors.outline,
              backgroundColor: checked ? theme.colors.primary : "transparent",
            },
          ]}
        >
          {checked && <Icon source="check" size={12} color={theme.colors.onPrimary} />}
        </View>

        <Text
          variant="bodyLarge"
          style={[
            styles.ingredientName,
            {
              color: checked ? theme.colors.onSurfaceVariant : theme.colors.onSurface,
              textDecorationLine: checked ? "line-through" : "none",
            },
          ]}
        >
          {ingredient.item}
        </Text>

        {qty ? (
          <Text style={[styles.ingredientQty, { color: theme.colors.onSurfaceVariant }]}>
            {qty}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
};

const StepRow = ({
  step,
  isLast,
}: {
  step: RecipeStep;
  isLast: boolean;
}) => {
  const theme = useTheme();

  return (
    <View style={styles.stepRow}>
      <View style={styles.stepLeft}>
        <View style={[styles.stepCircle, { backgroundColor: theme.colors.primaryContainer }]}>
          <Text style={[styles.stepNum, { color: theme.colors.onPrimaryContainer }]}>
            {step.order}
          </Text>
        </View>
        {!isLast && (
          <View style={[styles.stepConnector, { backgroundColor: theme.colors.outline }]} />
        )}
      </View>

      <View style={styles.stepContent}>
        {step.title ? (
          <Text style={[styles.stepTitle, { color: theme.colors.onSurface }]}>{step.title}</Text>
        ) : null}
        <Text
          variant="bodyLarge"
          style={[styles.stepInstruction, { color: theme.colors.onSurfaceVariant }]}
        >
          {step.instruction}
        </Text>
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  heroImage: { width: "100%", height: 320 },
  heroNav: {
    position: "absolute",
    left: 8,
    right: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroNavRight: { flexDirection: "row", gap: 4 },
  glassBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 248, 245, 0.90)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: "rgba(26, 22, 18, 0.10)",
  },
  detailBody: {
    marginTop: -20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    gap: 20,
    zIndex: 2,
  },
  adjustedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: -4,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.12,
    textTransform: "uppercase",
  },
  detailTitle: { marginTop: -8 },
  statsRow: { flexDirection: "row", gap: 8 },
  segmented: {
    flexDirection: "row",
    borderRadius: 999,
    borderWidth: 1,
    height: 48,
    padding: 4,
  },
  segmentTab: { flex: 1 },
  segmentPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 8,
  },
  sectionHeading: { gap: 2, marginBottom: -4 },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: 52,
    paddingVertical: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  ingredientName: { flex: 1 },
  ingredientQty: {
    fontSize: 13,
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
    flexShrink: 0,
  },
  stepRow: { flexDirection: "row", gap: 14 },
  stepLeft: { width: 32, alignItems: "center" },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  stepNum: { fontSize: 14, fontWeight: "500" },
  stepConnector: { flex: 1, width: 1.5, marginVertical: 4 },
  stepContent: { flex: 1, paddingBottom: 24, paddingTop: 4, gap: 4 },
  stepTitle: { fontSize: 16, fontWeight: "700", lineHeight: 22 },
  stepInstruction: { lineHeight: 22 },
  dropdownMenu: {
    position: "absolute",
    right: 0,
    top: 52,
    backgroundColor: "#FFF8F5",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(26,22,18,0.20)",
    minWidth: 180,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
    overflow: "hidden",
    transformOrigin: "top right",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemText: { fontSize: 15, fontWeight: "500", color: "#B3261E" },

  // Bottom bars
  aiBar: {
    position: "absolute",
    left: 16,
    right: 16,
    height: 56,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  aiSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  historyBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  adjustedBar: {
    position: "absolute",
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  versionToggle: {
    flexDirection: "row",
    borderRadius: 999,
    borderWidth: 1,
    height: 36,
    padding: 3,
  },
  toggleOption: {
    paddingHorizontal: 10,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  adjustMoreBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
  },
  saveBtn: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  // Dialogs
  dialogOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  dialogBox: {
    width: "100%",
    borderRadius: 24,
    padding: 24,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  dialogTitle: { fontSize: 20, fontWeight: "700" },
  dialogBody: { fontSize: 15, lineHeight: 22 },
  dialogActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  dialogCancelBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  dialogDeleteBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: "#B3261E",
  },
  dialogSaveNewBtn: {
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 999,
  },
  dialogSecondaryBtn: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  dialogSecondaryBtnText: {
    fontSize: 16,
    fontWeight: "600",
  },
  dialogCancelText: {
    paddingVertical: 8,
  },
});
