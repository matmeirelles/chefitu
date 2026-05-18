import { useEffect, useRef, useState } from "react";
import { Alert, Animated, Image, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import type { ChatMessage, RecipeIngredient, RecipeRecord, RecipeStep } from "@my-recipes/shared";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AdjustRecipePanel, type UIMessage } from "../components/AdjustRecipePanel";
import { MetricCard } from "../components/MetricCard";
import { FALLBACK_COVER_IMAGE } from "../constants";
import { deleteRecipe, saveNewRecipe, updateRecipe } from "../services/api";
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING, TYPE_SCALE } from "../design-system/tokens";
import { DSText } from "../design-system/Text";
import { DSIcon } from "../design-system/Icon";
import { DSButton } from "../design-system/Button";

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
  const insets = useSafeAreaInsets();

  const [currentRecipe, setCurrentRecipe] = useState(recipe);
  const [activeTab, setActiveTab] = useState<DetailTab>("ingredients");
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuAnim = useRef(new Animated.Value(0)).current;

  const [panelOpen, setPanelOpen] = useState(false);
  const [adjustmentSessionId] = useState(() => createAdjustmentSessionId(recipe.id));
  const [apiHistory, setApiHistory] = useState<ChatMessage[]>([]);
  const [uiMessages, setUiMessages] = useState<UIMessage[]>([]);
  const [appliedRecipe, setAppliedRecipe] = useState<RecipeRecord | null>(null);
  const [viewingOriginal, setViewingOriginal] = useState(false);

  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  const hasAdjustment = appliedRecipe !== null;
  const displayedRecipe = hasAdjustment && !viewingOriginal ? appliedRecipe : currentRecipe;
  const hasHistory = uiMessages.some((m) => m.kind === "user");

  useEffect(() => { setCurrentRecipe(recipe); }, [recipe]);

  const openMenu = () => {
    setMenuOpen(true);
    Animated.timing(menuAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
  };
  const closeMenu = () => {
    Animated.timing(menuAnim, { toValue: 0, duration: 100, useNativeDriver: true }).start(() =>
      setMenuOpen(false),
    );
  };

  const handleDeletePress = () => { closeMenu(); setTimeout(() => setConfirmDelete(true), 120); };

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

  const handleBack = () => {
    if (hasAdjustment) { setShowUnsavedWarning(true); } else { onBack(); }
  };

  const handleApply = (adjusted: RecipeRecord) => {
    setAppliedRecipe(adjusted);
    setViewingOriginal(false);
    setCheckedIngredients(new Set());
  };

  const handleSaveOverwrite = async () => {
    if (!appliedRecipe) return;
    setSaving(true);
    try {
      const updated = await updateRecipe(recipe.id, {
        title: appliedRecipe.title,
        category: appliedRecipe.category,
        cuisine: appliedRecipe.cuisine,
        ingredients: appliedRecipe.ingredients,
        steps: appliedRecipe.steps,
        totalTimeMinutes: appliedRecipe.totalTimeMinutes,
        servings: appliedRecipe.servings,
        tags: appliedRecipe.tags,
      });
      setCurrentRecipe(updated);
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
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Hero */}
        <View>
          <Image
            source={{ uri: displayedRecipe.coverImageUrl ?? FALLBACK_COVER_IMAGE }}
            style={styles.heroImage}
          />
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <View style={[styles.heroNav, { top: insets.top + 8 }]}>
              <Pressable onPress={handleBack} style={styles.glassBtn}>
                <DSIcon name="ArrowLeft" size={22} color={COLORS.marrom} strokeWidth={2} />
              </Pressable>
              <View style={styles.heroNavRight}>
                <Pressable style={styles.glassBtn}>
                  <DSIcon name="Bookmark" size={20} color={COLORS.marrom} strokeWidth={1.75} />
                </Pressable>
                <Pressable style={styles.glassBtn}>
                  <DSIcon name="Share2" size={20} color={COLORS.marrom} strokeWidth={1.75} />
                </Pressable>
                <View>
                  <Pressable style={styles.glassBtn} onPress={menuOpen ? closeMenu : openMenu}>
                    <DSIcon name="MoreVertical" size={20} color={COLORS.marrom} strokeWidth={1.75} />
                  </Pressable>
                  {menuOpen && (
                    <Animated.View
                      style={[
                        styles.dropdownMenu,
                        {
                          opacity: menuAnim,
                          transform: [{ scale: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
                        },
                      ]}
                    >
                      <Pressable style={styles.menuItem} onPress={handleDeletePress}>
                        <DSIcon name="Trash2" size={18} color={COLORS.danger} strokeWidth={1.75} />
                        <DSText style={styles.menuItemText}>Deletar</DSText>
                      </Pressable>
                    </Animated.View>
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Body card */}
        <View style={styles.detailBody}>
          {hasAdjustment && (
            <View style={styles.adjustedBadge}>
              <DSIcon name="Sparkles" size={14} color={COLORS.laranja} strokeWidth={1.75} />
              <DSText style={{ color: COLORS.laranja, fontSize: TYPE_SCALE.bodySm, fontWeight: "500" }}>
                {viewingOriginal ? "Visualizando original" : "Receita ajustada"}
              </DSText>
            </View>
          )}

          {(displayedRecipe.category || displayedRecipe.cuisine) && (
            <DSText style={styles.eyebrow}>
              {[displayedRecipe.category, displayedRecipe.cuisine].filter(Boolean).join(" · ").toUpperCase()}
            </DSText>
          )}

          <DSText style={styles.detailTitle}>{displayedRecipe.title}</DSText>

          <View style={styles.statsRow}>
            <MetricCard value={displayedRecipe.totalTimeMinutes?.toString() ?? "—"} label="Min" />
            <MetricCard value={displayedRecipe.servings?.split(" ")[0] ?? "—"} label="Porções" />
            <MetricCard value={displayedRecipe.ingredients.length.toString()} label="Ingredientes" />
          </View>

          {/* Segmented control */}
          <View style={styles.segmented}>
            {(["ingredients", "instructions"] as DetailTab[]).map((tab) => {
              const active = activeTab === tab;
              return (
                <Pressable key={tab} onPress={() => setActiveTab(tab)} style={styles.segmentTab}>
                  <View style={[styles.segmentPill, active && styles.segmentPillActive]}>
                    {active && <DSIcon name="Check" size={15} color={COLORS.marrom} strokeWidth={2.5} />}
                    <DSText style={[styles.segmentLabel, { color: active ? COLORS.marrom : COLORS.marromSoft }]}>
                      {tab === "ingredients" ? "Ingredientes" : "Instruções"}
                    </DSText>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.sectionHeading}>
            <DSText style={styles.sectionTitle}>
              {activeTab === "ingredients" ? "Ingredientes" : "Instruções"}
            </DSText>
            <DSText style={styles.sectionSubtitle}>
              {activeTab === "ingredients"
                ? `Para ${displayedRecipe.servings ?? "sua receita"}`
                : `${displayedRecipe.steps.length} passos`}
            </DSText>
          </View>

          {activeTab === "instructions" && displayedRecipe.instructionsGeneratedByAi && (
            <View style={styles.aiNotice}>
              <View style={styles.aiNoticeHeader}>
                <DSIcon name="Sparkles" size={16} color={COLORS.laranja} strokeWidth={1.75} />
                <DSText style={styles.aiNoticeTitle}>Instruções geradas por IA</DSText>
              </View>
              <DSText style={styles.aiNoticeBody}>
                A fonte original tinha apenas ingredientes. Esses passos são uma sugestão da IA — revise antes de cozinhar.
              </DSText>
            </View>
          )}

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

      {/* Bottom bar */}
      {hasAdjustment ? (
        <View style={[styles.adjustedBar, { bottom: insets.bottom + 8 }]}>
          <View style={styles.versionToggle}>
            <Pressable
              onPress={() => { setViewingOriginal(true); setCheckedIngredients(new Set()); }}
              style={[styles.toggleOption, viewingOriginal && styles.toggleOptionActive]}
            >
              <DSText style={[styles.toggleLabel, { color: viewingOriginal ? COLORS.marrom : COLORS.marromSoft }]}>
                Original
              </DSText>
            </Pressable>
            <Pressable
              onPress={() => { setViewingOriginal(false); setCheckedIngredients(new Set()); }}
              style={[styles.toggleOption, !viewingOriginal && styles.toggleOptionActive]}
            >
              <DSText style={[styles.toggleLabel, { color: !viewingOriginal ? COLORS.marrom : COLORS.marromSoft }]}>
                Ajustada
              </DSText>
            </Pressable>
          </View>

          <Pressable onPress={() => setPanelOpen(true)} style={styles.adjustMoreBtn}>
            <DSIcon name="Sparkles" size={14} color={COLORS.laranja} strokeWidth={1.75} />
            <DSText style={{ color: COLORS.marrom, fontSize: TYPE_SCALE.bodySm, fontWeight: "500" }}>
              Ajustar mais
            </DSText>
          </Pressable>

          <Pressable onPress={() => setShowSaveDialog(true)} style={styles.saveBtn}>
            <DSText style={{ color: COLORS.white, fontSize: TYPE_SCALE.bodySm, fontWeight: "600" }}>
              Salvar
            </DSText>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => setPanelOpen(true)}
          style={[styles.aiBar, { bottom: insets.bottom + 16 }]}
        >
          <DSIcon name="Sparkles" size={20} color={COLORS.laranja} strokeWidth={1.75} />
          <DSText style={{ flex: 1, color: hasHistory ? COLORS.marrom : COLORS.marromSoft, fontWeight: hasHistory ? "500" : "400" }} numberOfLines={1}>
            {hasHistory ? "Continuar ajustando…" : "Adaptar ao meu gosto…"}
          </DSText>
          {hasHistory ? (
            <View style={styles.historyBadge}>
              <DSText style={{ color: COLORS.white, fontWeight: "700", fontSize: 11 }}>
                {uiMessages.filter((m) => m.kind === "user").length}
              </DSText>
            </View>
          ) : (
            <View style={styles.aiSendBtn}>
              <DSIcon name="ArrowUp" size={20} color={COLORS.white} strokeWidth={2} />
            </View>
          )}
        </Pressable>
      )}

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

      {/* Delete confirmation */}
      <Modal visible={confirmDelete} transparent animationType="fade" onRequestClose={() => setConfirmDelete(false)}>
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogBox}>
            <DSText style={styles.dialogTitle}>Deletar receita?</DSText>
            <DSText style={styles.dialogBody}>
              Isso vai remover permanentemente{" "}
              <DSText style={{ fontWeight: "700", color: COLORS.marrom }}>{recipe.title}</DSText>{" "}
              da sua biblioteca. Essa ação não pode ser desfeita.
            </DSText>
            <View style={styles.dialogActions}>
              <Pressable style={styles.dialogCancelBtn} onPress={() => setConfirmDelete(false)} disabled={deleting}>
                <DSText style={{ color: COLORS.marrom, fontWeight: "500" }}>Cancelar</DSText>
              </Pressable>
              <Pressable
                style={[styles.dialogDeleteBtn, { opacity: deleting ? 0.6 : 1 }]}
                onPress={() => void handleConfirmDelete()}
                disabled={deleting}
              >
                <DSText style={{ color: COLORS.white, fontWeight: "600" }}>
                  {deleting ? "Deletando…" : "Deletar"}
                </DSText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Unsaved warning */}
      <Modal visible={showUnsavedWarning} transparent animationType="fade" onRequestClose={() => setShowUnsavedWarning(false)}>
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogBox}>
            <DSText style={styles.dialogTitle}>Sair sem salvar?</DSText>
            <DSText style={styles.dialogBody}>
              Se você sair, perderá os ajustes realizados na receita.
            </DSText>
            <View style={styles.dialogActions}>
              <Pressable style={styles.dialogCancelBtn} onPress={() => setShowUnsavedWarning(false)}>
                <DSText style={{ color: COLORS.marrom, fontWeight: "500" }}>Voltar</DSText>
              </Pressable>
              <Pressable
                style={[styles.dialogDeleteBtn, { backgroundColor: COLORS.danger }]}
                onPress={() => { setShowUnsavedWarning(false); onBack(); }}
              >
                <DSText style={{ color: COLORS.white, fontWeight: "600" }}>Sair</DSText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Save dialog */}
      <Modal visible={showSaveDialog} transparent animationType="fade" onRequestClose={() => setShowSaveDialog(false)}>
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogBox}>
            <DSText style={styles.dialogTitle}>Salvar receita ajustada</DSText>
            <DSText style={styles.dialogBody}>Como você quer salvar essa receita?</DSText>
            <View style={[styles.dialogActions, { flexDirection: "column" }]}>
              <Pressable
                style={[styles.dialogSecondaryBtn, { opacity: saving ? 0.6 : 1 }]}
                onPress={() => void handleSaveOverwrite()}
                disabled={saving}
              >
                <DSText style={{ color: COLORS.marrom, fontWeight: "600", fontSize: TYPE_SCALE.body }}>
                  Substituir original
                </DSText>
              </Pressable>
              <DSButton
                variant="primary"
                onPress={() => void handleSaveAsNew()}
                style={{ opacity: saving ? 0.6 : 1 }}
              >
                Salvar como nova receita
              </DSButton>
            </View>
            <Pressable style={styles.dialogCancelText} onPress={() => setShowSaveDialog(false)} disabled={saving}>
              <DSText style={{ color: COLORS.marromSoft, textAlign: "center", fontSize: TYPE_SCALE.bodySm }}>
                Cancelar
              </DSText>
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
  const qty = [ingredient.amount, ingredient.unit].filter(Boolean).join(" ");
  return (
    <Pressable onPress={onToggle}>
      <View style={[styles.ingredientRow, !isLast && styles.ingredientRowBorder]}>
        <View style={[styles.checkbox, { borderColor: checked ? COLORS.laranja : "rgba(74,44,26,0.14)", backgroundColor: checked ? COLORS.laranja : "transparent" }]}>
          {checked && <DSIcon name="Check" size={12} color={COLORS.white} strokeWidth={2.5} />}
        </View>
        <DSText style={[styles.ingredientName, { color: checked ? COLORS.marromSoft : COLORS.marrom, textDecorationLine: checked ? "line-through" : "none" }]}>
          {ingredient.item}
        </DSText>
        {qty ? <DSText style={styles.ingredientQty}>{qty}</DSText> : null}
      </View>
    </Pressable>
  );
};

const StepRow = ({ step, isLast }: { step: RecipeStep; isLast: boolean }) => (
  <View style={styles.stepRow}>
    <View style={styles.stepLeft}>
      <View style={styles.stepCircle}>
        <DSText style={styles.stepNum}>{step.order}</DSText>
      </View>
      {!isLast && <View style={styles.stepConnector} />}
    </View>
    <View style={styles.stepContent}>
      {step.title ? <DSText style={styles.stepTitle}>{step.title}</DSText> : null}
      <DSText style={styles.stepInstruction}>{step.instruction}</DSText>
    </View>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const OUTLINE = "rgba(74, 44, 26, 0.14)";
const OUTLINE_FAINT = "rgba(74, 44, 26, 0.10)";

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.creme },
  heroImage: { width: "100%", height: 320 },
  heroNav: { position: "absolute", left: 8, right: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  heroNavRight: { flexDirection: "row", gap: 4 },
  glassBtn: { width: 40, height: 40, borderRadius: RADIUS.pill, backgroundColor: "rgba(255, 246, 233, 0.92)", alignItems: "center", justifyContent: "center", borderWidth: 0.5, borderColor: OUTLINE_FAINT },
  detailBody: { marginTop: -20, borderTopLeftRadius: RADIUS.sheet, borderTopRightRadius: RADIUS.sheet, paddingHorizontal: SPACING[6], paddingTop: SPACING[8], gap: SPACING[5], backgroundColor: COLORS.creme, zIndex: 2 },
  adjustedBadge: { flexDirection: "row", alignItems: "center", gap: SPACING[2], paddingHorizontal: SPACING[3], paddingVertical: SPACING[2], borderRadius: RADIUS.sm, backgroundColor: COLORS.laranjaSoft, marginBottom: -SPACING[1] },
  eyebrow: { fontSize: TYPE_SCALE.caption, fontWeight: "500", letterSpacing: 0.12, textTransform: "uppercase", color: COLORS.laranja },
  detailTitle: { fontFamily: FONTS.displayBold, fontWeight: "700", fontSize: TYPE_SCALE.h1, color: COLORS.marrom, marginTop: -SPACING[2] },
  statsRow: { flexDirection: "row", gap: SPACING[2] },
  segmented: { flexDirection: "row", borderRadius: RADIUS.pill, borderWidth: 1, borderColor: OUTLINE, height: 48, padding: 4 },
  segmentTab: { flex: 1 },
  segmentPill: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: RADIUS.pill, paddingHorizontal: SPACING[2] },
  segmentPillActive: { backgroundColor: COLORS.salvia },
  segmentLabel: { fontFamily: FONTS.uiSemiBold, fontWeight: "600", fontSize: TYPE_SCALE.bodySm },
  sectionHeading: { gap: 2, marginBottom: -SPACING[1] },
  sectionTitle: { fontFamily: FONTS.uiBold, fontWeight: "700", fontSize: TYPE_SCALE.h3, color: COLORS.marrom },
  sectionSubtitle: { fontSize: TYPE_SCALE.bodySm, color: COLORS.marromSoft },
  aiNotice: { borderWidth: 1, borderColor: COLORS.laranjaSoft, borderRadius: RADIUS.input, paddingHorizontal: SPACING[4], paddingVertical: SPACING[4], gap: SPACING[2], marginTop: -SPACING[1] },
  aiNoticeHeader: { flexDirection: "row", alignItems: "center", gap: SPACING[2] },
  aiNoticeTitle: { fontFamily: FONTS.uiBold, fontWeight: "700", fontSize: TYPE_SCALE.bodySm, color: COLORS.marrom },
  aiNoticeBody: { fontSize: TYPE_SCALE.bodySm, color: COLORS.marromSoft, lineHeight: 20 },
  ingredientRow: { flexDirection: "row", alignItems: "center", gap: SPACING[3] + 2, minHeight: 52, paddingVertical: SPACING[2] + 2 },
  ingredientRowBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.bege },
  checkbox: { width: 18, height: 18, borderRadius: 3, borderWidth: 1.5, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  ingredientName: { flex: 1, fontSize: TYPE_SCALE.body },
  ingredientQty: { fontSize: 13, fontWeight: "500", color: COLORS.marromSoft, fontVariant: ["tabular-nums"], flexShrink: 0 },
  stepRow: { flexDirection: "row", gap: SPACING[3] + 2 },
  stepLeft: { width: 32, alignItems: "center" },
  stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.laranjaSoft, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  stepNum: { fontSize: TYPE_SCALE.bodySm, fontWeight: "500", color: COLORS.marrom },
  stepConnector: { flex: 1, width: 1.5, marginVertical: 4, backgroundColor: OUTLINE },
  stepContent: { flex: 1, paddingBottom: SPACING[6], paddingTop: 4, gap: 4 },
  stepTitle: { fontSize: TYPE_SCALE.body, fontWeight: "700", lineHeight: 22, color: COLORS.marrom },
  stepInstruction: { fontSize: TYPE_SCALE.body, lineHeight: 22, color: COLORS.marromSoft },
  dropdownMenu: { position: "absolute", right: 0, top: 52, backgroundColor: COLORS.creme, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: OUTLINE, minWidth: 180, ...SHADOWS.md, zIndex: 100, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", gap: SPACING[2] + 2, paddingHorizontal: SPACING[4], paddingVertical: SPACING[3] + 2 },
  menuItemText: { fontSize: 15, fontWeight: "500", color: COLORS.danger },
  aiBar: { position: "absolute", left: 16, right: 16, height: 56, borderRadius: 28, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 10, backgroundColor: COLORS.bege, ...SHADOWS.md },
  aiSendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.laranja, alignItems: "center", justifyContent: "center" },
  historyBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.laranja, alignItems: "center", justifyContent: "center" },
  adjustedBar: { position: "absolute", left: 12, right: 12, flexDirection: "row", alignItems: "center", gap: SPACING[2], paddingHorizontal: 12, paddingVertical: 10, borderRadius: RADIUS.sheet, borderWidth: StyleSheet.hairlineWidth, borderColor: OUTLINE, backgroundColor: COLORS.creme, ...SHADOWS.md },
  versionToggle: { flexDirection: "row", borderRadius: RADIUS.pill, borderWidth: 1, borderColor: OUTLINE, height: 36, padding: 3 },
  toggleOption: { paddingHorizontal: 10, borderRadius: RADIUS.pill, alignItems: "center", justifyContent: "center" },
  toggleOptionActive: { backgroundColor: COLORS.salvia },
  toggleLabel: { fontSize: TYPE_SCALE.bodySm, fontWeight: "500" },
  adjustMoreBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, height: 36, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: OUTLINE },
  saveBtn: { paddingHorizontal: 16, height: 36, borderRadius: RADIUS.pill, backgroundColor: COLORS.laranja, alignItems: "center", justifyContent: "center" },
  dialogOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  dialogBox: { width: "100%", borderRadius: RADIUS.sheet, padding: SPACING[6], gap: 12, backgroundColor: COLORS.creme, ...SHADOWS.lg },
  dialogTitle: { fontSize: TYPE_SCALE.h2, fontWeight: "700", color: COLORS.marrom },
  dialogBody: { fontSize: TYPE_SCALE.body, lineHeight: 22, color: COLORS.marromSoft },
  dialogActions: { flexDirection: "row", gap: 12, marginTop: SPACING[2] },
  dialogCancelBtn: { flex: 1, alignItems: "center", paddingVertical: 14, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: OUTLINE },
  dialogDeleteBtn: { flex: 1, alignItems: "center", paddingVertical: 14, borderRadius: RADIUS.pill, backgroundColor: COLORS.danger },
  dialogSecondaryBtn: { width: "100%", alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: OUTLINE, backgroundColor: "transparent" },
  dialogCancelText: { paddingVertical: 8 },
});
