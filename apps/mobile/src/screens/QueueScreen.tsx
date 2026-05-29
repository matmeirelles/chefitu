import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ImportListItem, ImportStatus } from "@chefitu/shared";
import { createImport, deleteImport, fetchImports, retryImport } from "../services/api";
import { formatRelativeTime } from "../utils/time";
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING, TYPE_SCALE } from "../design-system/tokens";
import { DSText } from "../design-system/Text";
import { DSIcon } from "../design-system/Icon";

const OUTLINE = "rgba(74, 44, 26, 0.14)";

export const QueueScreen = () => {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<ImportListItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchImports();
      setItems(data.items);
    } catch {}
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleRetry = async (id: string) => {
    try { await retryImport(id); await load(); }
    catch { Alert.alert("Não foi possível tentar novamente", "Tente mais tarde."); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteImport(id); await load(); }
    catch { Alert.alert("Não foi possível deletar", "Tente mais tarde."); }
  };

  const handleAdd = async () => {
    if (!url.trim()) return;
    setSubmitting(true);
    try {
      await createImport(url.trim());
      setUrl("");
      setModalVisible(false);
      await load();
    } catch {
      Alert.alert("Não foi possível adicionar a receita", "Verifique o link e tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const queued = items.filter((i) => i.status === "queued").length;
  const processing = items.filter((i) => i.status === "processing").length;
  const subtitleParts: string[] = [];
  if (queued > 0) subtitleParts.push(`${queued} na fila`);
  if (processing > 0) subtitleParts.push(`${processing} processando`);

  return (
    <View style={[styles.root, { backgroundColor: COLORS.creme }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <DSText style={styles.title}>Fila de importação</DSText>
          {subtitleParts.length > 0 && (
            <DSText style={styles.subtitle}>{subtitleParts.join(" · ")}</DSText>
          )}
        </View>

        <View style={styles.list}>
          {items.length === 0 ? (
            <DSText style={styles.empty}>Nenhum item na fila.</DSText>
          ) : (
            items.map((item) => (
              <QueueItemCard
                key={item.id}
                item={item}
                menuOpen={openMenuId === item.id}
                onOpenMenu={() => setOpenMenuId(item.id)}
                onCloseMenu={() => setOpenMenuId(null)}
                onRetry={() => void handleRetry(item.id)}
                onDelete={() => void handleDelete(item.id)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => setModalVisible(true)}
        style={[styles.fab, { bottom: insets.bottom + 16 }]}
      >
        <DSIcon name="Plus" size={20} color={COLORS.white} strokeWidth={2.5} />
        <DSText style={styles.fabText}>Adicionar receita</DSText>
      </Pressable>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setModalVisible(false)} />
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.modalHandle} />
            <DSText style={styles.modalTitle}>Adicionar receita</DSText>
            <DSText style={styles.modalSubtitle}>Cole a URL de um post do Instagram</DSText>

            <TextInput
              value={url}
              onChangeText={setUrl}
              placeholder="https://www.instagram.com/p/..."
              placeholderTextColor={COLORS.marromSoft}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={styles.input}
            />

            <View style={styles.modalActions}>
              <Pressable onPress={() => { setModalVisible(false); setUrl(""); }} style={styles.cancelBtn}>
                <DSText style={{ color: COLORS.marromSoft, fontWeight: "500" }}>Cancelar</DSText>
              </Pressable>
              <Pressable
                onPress={() => void handleAdd()}
                disabled={submitting || !url.trim()}
                style={[styles.addBtn, { opacity: submitting || !url.trim() ? 0.5 : 1 }]}
              >
                <DSText style={{ color: COLORS.white, fontWeight: "600" }}>
                  {submitting ? "Adicionando…" : "Adicionar"}
                </DSText>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const QueueItemCard = ({
  item,
  menuOpen,
  onOpenMenu,
  onCloseMenu,
  onRetry,
  onDelete,
}: {
  item: ImportListItem;
  menuOpen: boolean;
  onOpenMenu: () => void;
  onCloseMenu: () => void;
  onRetry: () => void;
  onDelete: () => void;
}) => {
  const canRetry = item.status === "failed" || item.status === "no_recipe_in_description";
  const scale = useRef(new Animated.Value(1)).current;
  const menuAnim = useRef(new Animated.Value(0)).current;
  const [confirmVisible, setConfirmVisible] = useState(false);

  useEffect(() => {
    Animated.timing(menuAnim, { toValue: menuOpen ? 1 : 0, duration: menuOpen ? 150 : 100, useNativeDriver: true }).start();
  }, [menuAnim, menuOpen]);

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 0 }).start();

  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 2 }).start();

  return (
    <>
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <View style={styles.cardRow}>
          <StatusPill status={item.status} />
          <View style={styles.cardRowRight}>
            <DSText style={styles.timestamp}>{formatRelativeTime(item.createdAt)}</DSText>
            <View>
              <Pressable onPress={menuOpen ? onCloseMenu : onOpenMenu} hitSlop={8}>
                <DSIcon name="MoreVertical" size={18} color={COLORS.marromSoft} strokeWidth={1.75} />
              </Pressable>
              {menuOpen && (
                <Animated.View style={[styles.cardMenu, { opacity: menuAnim, transform: [{ scale: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] }]}>
                  <Pressable style={styles.cardMenuItem} onPress={() => { onCloseMenu(); setTimeout(() => setConfirmVisible(true), 120); }}>
                    <DSIcon name="Trash2" size={16} color={COLORS.danger} strokeWidth={1.75} />
                    <DSText style={styles.cardMenuItemText}>Deletar</DSText>
                  </Pressable>
                </Animated.View>
              )}
            </View>
          </View>
        </View>

        <Pressable onPress={() => void Linking.openURL(item.sourceUrl)} onPressIn={handlePressIn} onPressOut={handlePressOut}>
          <View style={styles.urlRow}>
            <DSIcon name="Link" size={16} color={COLORS.marromSoft} strokeWidth={1.75} />
            <DSText style={styles.url} numberOfLines={1} ellipsizeMode="tail">{item.sourceUrl}</DSText>
          </View>
        </Pressable>

        {canRetry && (
          <Pressable onPress={onRetry} style={styles.retryBtn}>
            <DSIcon name="RefreshCw" size={14} color={COLORS.laranja} strokeWidth={2} />
            <DSText style={styles.retryText}>Tentar novamente</DSText>
          </Pressable>
        )}
      </Animated.View>

      <Modal visible={confirmVisible} transparent animationType="fade" onRequestClose={() => setConfirmVisible(false)}>
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogBox}>
            <DSText style={styles.dialogTitle}>Remover da fila?</DSText>
            <DSText style={styles.dialogBody}>Esse item será removido permanentemente da fila.</DSText>
            <View style={styles.dialogActions}>
              <Pressable style={styles.dialogCancelBtn} onPress={() => setConfirmVisible(false)}>
                <DSText style={{ color: COLORS.marrom, fontWeight: "500" }}>Cancelar</DSText>
              </Pressable>
              <Pressable style={styles.dialogDeleteBtn} onPress={() => { setConfirmVisible(false); onDelete(); }}>
                <DSText style={{ color: COLORS.white, fontWeight: "600" }}>Deletar</DSText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const STATUS_CONFIG: Record<ImportStatus, { label: string; icon: string; bg: string; color: string }> = {
  queued:                  { label: "Na fila",     icon: "Clock",        bg: COLORS.bege,     color: COLORS.marromSoft },
  processing:              { label: "Processando", icon: "Loader2",      bg: COLORS.laranjaSoft, color: COLORS.laranjaDark },
  failed:                  { label: "Falhou",      icon: "AlertCircle",  bg: COLORS.dangerBg, color: COLORS.danger },
  no_recipe_in_description:{ label: "Sem receita", icon: "HelpCircle",   bg: COLORS.warningBg, color: COLORS.warning },
  ready:                   { label: "Pronto",      icon: "CheckCircle2", bg: COLORS.salvia,   color: COLORS.verdeDark },
};

const StatusPill = ({ status }: { status: ImportStatus }) => {
  const config = STATUS_CONFIG[status];
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (status !== "processing") return;
    const anim = Animated.loop(Animated.timing(spinValue, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true }));
    anim.start();
    return () => anim.stop();
  }, [status, spinValue]);

  const rotate = spinValue.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <View style={[styles.pill, { backgroundColor: config.bg }]}>
      {status === "processing" ? (
        <Animated.View style={{ transform: [{ rotate }] }}>
          <DSIcon name="Loader2" size={13} color={config.color} strokeWidth={2} />
        </Animated.View>
      ) : (
        <DSIcon name={config.icon as any} size={13} color={config.color} strokeWidth={1.75} />
      )}
      <DSText style={[styles.pillText, { color: config.color }]}>{config.label}</DSText>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: SPACING[5], paddingBottom: 32 },
  header: { marginBottom: SPACING[6], gap: 4 },
  title: { fontFamily: FONTS.displayBold, fontWeight: "700", fontSize: TYPE_SCALE.h1, color: COLORS.marrom },
  subtitle: { fontSize: TYPE_SCALE.caption, color: COLORS.marromSoft, letterSpacing: 0.3 },
  empty: { fontSize: TYPE_SCALE.bodySm, textAlign: "center", marginTop: 48, color: COLORS.marromSoft },
  list: { gap: 0 },
  card: { backgroundColor: COLORS.bege, borderRadius: RADIUS.card, padding: SPACING[4], marginBottom: SPACING[3], gap: 10 },
  cardRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardRowRight: { flexDirection: "row", alignItems: "center", gap: SPACING[2] },
  timestamp: { fontSize: 11, color: COLORS.marromSoft, letterSpacing: 0.2 },
  urlRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  url: { fontSize: 13, flex: 1, color: COLORS.marrom },
  retryBtn: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start" },
  retryText: { fontSize: 13, fontWeight: "500", color: COLORS.laranja },
  cardMenu: { position: "absolute", right: 0, top: 26, backgroundColor: COLORS.creme, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: OUTLINE, minWidth: 140, ...SHADOWS.md, zIndex: 100, overflow: "hidden" },
  cardMenuItem: { flexDirection: "row", alignItems: "center", gap: SPACING[2], paddingHorizontal: SPACING[3] + 2, paddingVertical: 12 },
  cardMenuItemText: { fontSize: 14, fontWeight: "500", color: COLORS.danger },
  pill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.pill },
  pillText: { fontSize: 12, fontWeight: "500" },
  fab: { position: "absolute", right: 20, flexDirection: "row", alignItems: "center", gap: SPACING[2], paddingHorizontal: SPACING[5], paddingVertical: 14, borderRadius: RADIUS.pill, backgroundColor: COLORS.laranja, ...SHADOWS.cta },
  fabText: { fontSize: 15, fontWeight: "600", color: COLORS.white },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  modalSheet: { borderTopLeftRadius: RADIUS.sheet, borderTopRightRadius: RADIUS.sheet, paddingHorizontal: SPACING[6], paddingTop: 12, gap: 4, backgroundColor: COLORS.creme },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: OUTLINE, alignSelf: "center", marginBottom: SPACING[4] },
  modalTitle: { fontFamily: FONTS.displayBold, fontWeight: "700", fontSize: TYPE_SCALE.h2, color: COLORS.marrom, marginBottom: 2 },
  modalSubtitle: { fontSize: 13, color: COLORS.marromSoft, marginBottom: SPACING[4] },
  input: { borderRadius: RADIUS.sm, paddingHorizontal: SPACING[3] + 2, paddingVertical: 12, fontSize: TYPE_SCALE.bodySm, marginBottom: SPACING[5], backgroundColor: COLORS.bege, color: COLORS.marrom },
  modalActions: { flexDirection: "row", gap: 12 },
  cancelBtn: { flex: 1, alignItems: "center", paddingVertical: 13, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: OUTLINE },
  addBtn: { flex: 1, alignItems: "center", paddingVertical: 13, borderRadius: RADIUS.sm, backgroundColor: COLORS.laranja },
  dialogOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  dialogBox: { width: "100%", borderRadius: RADIUS.sheet, padding: SPACING[6], gap: 12, backgroundColor: COLORS.creme, ...SHADOWS.lg },
  dialogTitle: { fontSize: TYPE_SCALE.h2, fontWeight: "700", color: COLORS.marrom },
  dialogBody: { fontSize: TYPE_SCALE.body, lineHeight: 22, color: COLORS.marromSoft },
  dialogActions: { flexDirection: "row", gap: 12, marginTop: SPACING[2] },
  dialogCancelBtn: { flex: 1, alignItems: "center", paddingVertical: 14, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: OUTLINE },
  dialogDeleteBtn: { flex: 1, alignItems: "center", paddingVertical: 14, borderRadius: RADIUS.pill, backgroundColor: COLORS.danger },
});
