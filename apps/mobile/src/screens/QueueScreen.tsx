import { useCallback, useEffect, useRef, useState } from "react";
import {
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
import { Icon, Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ImportListItem, ImportStatus } from "@my-recipes/shared";
import { createImport, deleteImport, fetchImports, retryImport } from "../services/api";
import { formatRelativeTime } from "../utils/time";

export const QueueScreen = () => {
  const theme = useTheme();
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

  useEffect(() => {
    void load();
  }, [load]);

  const handleRetry = async (id: string) => {
    try {
      await retryImport(id);
      await load();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteImport(id);
      await load();
    } catch {}
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
    } finally {
      setSubmitting(false);
    }
  };

  const queued = items.filter((i) => i.status === "queued").length;
  const processing = items.filter((i) => i.status === "processing").length;

  const subtitleParts: string[] = [];
  if (queued > 0) subtitleParts.push(`${queued} queued`);
  if (processing > 0) subtitleParts.push(`${processing} processing`);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      {openMenuId !== null && (
        <Pressable
          style={[StyleSheet.absoluteFillObject, { zIndex: 50 }]}
          onPress={() => setOpenMenuId(null)}
        />
      )}
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            Queue
          </Text>
          {subtitleParts.length > 0 && (
            <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              {subtitleParts.join(" · ")}
            </Text>
          )}
        </View>

        {/* List */}
        <View style={styles.list}>
          {items.length === 0 ? (
            <Text style={[styles.empty, { color: theme.colors.onSurfaceVariant }]}>
              No items in queue.
            </Text>
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
        style={[
          styles.fab,
          { bottom: insets.bottom + 16, backgroundColor: theme.colors.primary },
        ]}
      >
        <Icon source="plus" size={20} color={theme.colors.onPrimary} />
        <Text style={[styles.fabText, { color: theme.colors.onPrimary }]}>
          Add recipe
        </Text>
      </Pressable>

      {/* Add Recipe Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setModalVisible(false)} />
          <View style={[styles.modalSheet, { backgroundColor: theme.colors.surface, paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
              Add recipe
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.colors.onSurfaceVariant }]}>
              Paste an Instagram post URL
            </Text>

            <TextInput
              value={url}
              onChangeText={setUrl}
              placeholder="https://www.instagram.com/p/..."
              placeholderTextColor={theme.colors.onSurfaceVariant}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surfaceVariant,
                  color: theme.colors.onSurface,
                },
              ]}
            />

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => { setModalVisible(false); setUrl(""); }}
                style={[styles.cancelBtn, { borderColor: theme.colors.outline }]}
              >
                <Text style={{ color: theme.colors.onSurfaceVariant, fontWeight: "500" }}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={() => void handleAdd()}
                disabled={submitting || !url.trim()}
                style={[
                  styles.addBtn,
                  {
                    backgroundColor:
                      submitting || !url.trim()
                        ? theme.colors.surfaceVariant
                        : theme.colors.primary,
                  },
                ]}
              >
                <Text
                  style={{
                    color:
                      submitting || !url.trim()
                        ? theme.colors.onSurfaceVariant
                        : theme.colors.onPrimary,
                    fontWeight: "600",
                  }}
                >
                  {submitting ? "Adding…" : "Add"}
                </Text>
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
  const theme = useTheme();
  const canRetry = item.status === "failed" || item.status === "no_recipe_in_description";
  const scale = useRef(new Animated.Value(1)).current;
  const menuAnim = useRef(new Animated.Value(0)).current;
  const [confirmVisible, setConfirmVisible] = useState(false);

  useEffect(() => {
    Animated.timing(menuAnim, {
      toValue: menuOpen ? 1 : 0,
      duration: menuOpen ? 150 : 100,
      useNativeDriver: true,
    }).start();
  }, [menuAnim, menuOpen]);

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 0 }).start();

  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 2 }).start();

  const handleDeletePress = () => {
    onCloseMenu();
    setTimeout(() => setConfirmVisible(true), 120);
  };

  return (
    <>
      <Pressable
        onPress={() => void Linking.openURL(item.sourceUrl)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
          {/* Row 1: status + timestamp + menu */}
          <View style={styles.cardRow}>
            <StatusIndicator status={item.status} />
            <View style={styles.cardRowRight}>
              <Text style={[styles.timestamp, { color: theme.colors.onSurfaceVariant }]}>
                {formatRelativeTime(item.createdAt)}
              </Text>
              <View>
                <Pressable onPress={menuOpen ? onCloseMenu : onOpenMenu} hitSlop={8}>
                  <Icon source="dots-vertical" size={18} color={theme.colors.onSurfaceVariant} />
                </Pressable>
                {menuOpen && (
                  <>
                    <Animated.View
                      style={[
                        styles.cardMenu,
                        {
                          opacity: menuAnim,
                          transform: [{ scale: menuAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
                        },
                      ]}
                    >
                      <Pressable style={styles.cardMenuItem} onPress={handleDeletePress}>
                        <Icon source="trash-can-outline" size={16} color="#B3261E" />
                        <Text style={styles.cardMenuItemText}>Deletar</Text>
                      </Pressable>
                    </Animated.View>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Row 2: URL */}
          <View style={styles.urlRow}>
            <Icon source="link-variant" size={16} color={theme.colors.onSurfaceVariant} />
            <Text
              style={[styles.url, { color: theme.colors.onSurface }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.sourceUrl}
            </Text>
          </View>

          {/* Row 3: Try again (conditional) */}
          {canRetry && (
            <Pressable onPress={onRetry} style={styles.retryBtn}>
              <Icon source="refresh" size={14} color={theme.colors.primary} />
              <Text style={[styles.retryText, { color: theme.colors.primary }]}>
                Tentar novamente
              </Text>
            </Pressable>
          )}
        </Animated.View>
      </Pressable>

      <Modal visible={confirmVisible} transparent animationType="fade" onRequestClose={() => setConfirmVisible(false)}>
        <View style={styles.dialogOverlay}>
          <View style={[styles.dialogBox, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.dialogTitle, { color: theme.colors.onSurface }]}>
              Remover da fila?
            </Text>
            <Text style={[styles.dialogBody, { color: theme.colors.onSurfaceVariant }]}>
              Esse item será removido permanentemente da fila.
            </Text>
            <View style={styles.dialogActions}>
              <Pressable
                style={[styles.dialogCancelBtn, { borderColor: theme.colors.outline }]}
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={{ color: theme.colors.onSurface, fontWeight: "500" }}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={styles.dialogDeleteBtn}
                onPress={() => { setConfirmVisible(false); onDelete(); }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>Deletar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const STATUS_CONFIG: Record<
  ImportStatus,
  { label: string; icon: string; bg: string; color: string }
> = {
  queued: {
    label: "Queued",
    icon: "clock-outline",
    bg: "#F3E5DD",
    color: "#52443D",
  },
  processing: {
    label: "Processing",
    icon: "loading",
    bg: "#FFDBC9",
    color: "#341000",
  },
  failed: {
    label: "Failed",
    icon: "alert-circle-outline",
    bg: "#FFEBEE",
    color: "#BA1A1A",
  },
  no_recipe_in_description: {
    label: "No Recipe",
    icon: "help-circle-outline",
    bg: "#FFF3E0",
    color: "#8B5E00",
  },
  ready: {
    label: "Ready",
    icon: "check-circle-outline",
    bg: "#E8F5E9",
    color: "#1B5E20",
  },
};

const StatusIndicator = ({ status }: { status: ImportStatus }) => {
  const config = STATUS_CONFIG[status];
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (status !== "processing") return;
    const anim = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [status, spinValue]);

  const rotate = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={[styles.pill, { backgroundColor: config.bg }]}>
      {status === "processing" ? (
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Icon source="loading" size={13} color={config.color} />
        </Animated.View>
      ) : (
        <Icon source={config.icon} size={13} color={config.color} />
      )}
      <Text style={[styles.pillText, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
    gap: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: "400",
  },
  subtitle: {
    fontSize: 12,
    letterSpacing: 0.3,
  },
  empty: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 48,
  },
  list: {
    gap: 0,
  },
  card: {
    backgroundColor: "#FEF1EB",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 10,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timestamp: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
  urlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  url: {
    fontSize: 13,
    flex: 1,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
  },
  retryText: {
    fontSize: 13,
    fontWeight: "500",
  },
  cardRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardMenu: {
    position: "absolute",
    right: 0,
    top: 26,
    backgroundColor: "#FFF8F5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(26,22,18,0.20)",
    minWidth: 140,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 100,
    overflow: "hidden",
  },
  cardMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cardMenuItemText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#B3261E",
  },
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
  dialogTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  dialogBody: {
    fontSize: 15,
    lineHeight: 22,
  },
  dialogActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
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
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "500",
  },
  fab: {
    position: "absolute",
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 999,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 15,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    gap: 4,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#00000020",
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
  },
  addBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 13,
    borderRadius: 12,
  },
});
