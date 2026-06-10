import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useSessionStore } from "@/stores/sessionStore";
import { useCartStore } from "@/stores/cartStore";
import { sessionService } from "@/services/sessions";
import { menuService } from "@/services/menu";
import { getErrorMessage } from "@/services/api";
import { MenuView } from "@/components/MenuView";
import { Button } from "@/components/ui/Button";
import { OrdersTab, OrdersTabHandle } from "@/components/session/OrdersTab";
import { BillTab, BillTabHandle } from "@/components/session/BillTab";
import { MenuProduct, Order, WaiterReason } from "@/types";

type Tab = "menu" | "orders" | "bill";

const WAITER_REASONS: WaiterReason[] = [
  { id: "order", label: "Quiero ordenar" },
  { id: "water", label: "Pedir agua" },
  { id: "cutlery", label: "Falta cubiertos" },
  { id: "bill", label: "Traer la cuenta" },
  { id: "other", label: "Otro motivo" },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export default function SessionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();

  const session = useSessionStore((s) => s.session);
  const menu = useSessionStore((s) => s.menu);
  const currentTimeSlot = useSessionStore((s) => s.currentTimeSlot);
  const setSession = useSessionStore((s) => s.setSession);
  const setMenu = useSessionStore((s) => s.setMenu);
  const setCurrentTimeSlot = useSessionStore((s) => s.setCurrentTimeSlot);
  const clearSession = useSessionStore((s) => s.clearSession);

  const ensureSession = useCartStore((s) => s.ensureSession);
  const cartCount = useCartStore((s) => s.getCount());

  const routeMatches = !!session && session.id === sessionId;

  const [tab, setTab] = useState<Tab>("menu");
  const [loading, setLoading] = useState(!routeMatches);
  const [menuLoading, setMenuLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waiterModal, setWaiterModal] = useState(false);
  const [customReason, setCustomReason] = useState("");
  const [callingWaiter, setCallingWaiter] = useState(false);
  const [waiterSent, setWaiterSent] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const ordersTabRef = useRef<OrdersTabHandle>(null);
  const billTabRef = useRef<BillTabHandle>(null);

  const handleSelectOrder = (order: Order) => {
    router.push(`/order/${order.id}`);
  };

  const handleRefresh = async () => {
    if (tab === "menu") return;
    setRefreshing(true);
    try {
      if (tab === "orders") await ordersTabRef.current?.refresh();
      if (tab === "bill") await billTabRef.current?.refresh();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (sessionId) ensureSession(sessionId);
  }, [sessionId, ensureSession]);

  // Load the route's session whenever the store is empty or holds a different
  // session (direct navigation, refresh, or switching tables).
  useEffect(() => {
    let active = true;
    if (sessionId && (!session || session.id !== sessionId)) {
      setLoading(true);
      setError(null);
      sessionService
        .getSession(sessionId)
        .then(async (s) => {
          if (!active) return;
          setSession(s);
          try {
            const m = await menuService.getMenu(s.branch.id);
            if (active) setMenu(m);
          } catch {
            /* menu optional */
          }
        })
        .catch((e) => active && setError(getErrorMessage(e)))
        .finally(() => active && setLoading(false));
    }
    return () => {
      active = false;
    };
  }, [session, sessionId, setSession, setMenu]);

  const handleSelectTimeSlot = async (slot: typeof currentTimeSlot) => {
    if (!slot || !session) return;
    setCurrentTimeSlot(slot);
    setMenuLoading(true);
    try {
      const m = await menuService.getMenu(session.branch.id, {
        time_slot_id: slot.id,
      });
      setMenu(m);
    } catch {
      /* keep existing menu */
    } finally {
      setMenuLoading(false);
    }
  };

  const handleSelectProduct = (product: MenuProduct) => {
    router.push(`/product/${product.id}`);
  };

  const callWaiter = async (reasonId: string) => {
    if (!session) return;
    setCallingWaiter(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await sessionService.callWaiter(
        session.id,
        reasonId,
        reasonId === "other" ? customReason.trim() || undefined : undefined,
      );
      setWaiterSent(true);
      setTimeout(() => {
        setWaiterModal(false);
        setWaiterSent(false);
        setCustomReason("");
      }, 1400);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setCallingWaiter(false);
    }
  };

  const leaveSession = () => {
    clearSession();
    ensureSession(null);
    router.replace("/(tabs)");
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Cargando mesa...
        </Text>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="alert-circle" size={44} color={colors.border} />
        <Text style={[styles.errTitle, { color: colors.foreground }]}>
          No pudimos cargar la mesa
        </Text>
        {error ? (
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            {error}
          </Text>
        ) : null}
        <Button title="Volver al inicio" onPress={leaveSession} />
      </View>
    );
  }

  const tableNumber = session.table?.number ?? "—";
  const restaurantName = session.restaurant?.name ?? session.branch?.name ?? "";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 12, borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.headerTop}>
          <Pressable onPress={leaveSession} hitSlop={10} style={styles.iconBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
              Mesa {tableNumber} · {restaurantName}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/cart")}
            hitSlop={10}
            style={styles.iconBtn}
          >
            <Feather name="shopping-bag" size={22} color={colors.foreground} />
            {cartCount > 0 ? (
              <View style={[styles.cartBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        {session.participants?.length > 0 ? (
          <View style={styles.participants}>
            {session.participants.slice(0, 6).map((p, i) => (
              <View
                key={p.id}
                style={[
                  styles.avatar,
                  {
                    backgroundColor: colors.primary + "22",
                    marginLeft: i === 0 ? 0 : -8,
                    borderColor: colors.background,
                  },
                ]}
              >
                <Text style={[styles.avatarText, { color: colors.primary }]}>
                  {initials(p.name)}
                </Text>
              </View>
            ))}
            <Text style={[styles.participantCount, { color: colors.mutedForeground }]}>
              {session.participants.length} en la mesa
            </Text>
          </View>
        ) : null}

        <View style={styles.tabs}>
          {(
            [
              { key: "menu", label: "Menú" },
              { key: "orders", label: "Pedidos" },
              { key: "bill", label: "Cuenta" },
            ] as { key: Tab; label: string }[]
          ).map((t) => (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              style={styles.tab}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: tab === t.key ? colors.primary : colors.mutedForeground },
                ]}
              >
                {t.label}
              </Text>
              {tab === t.key ? (
                <View style={[styles.tabIndicator, { backgroundColor: colors.primary }]} />
              ) : null}
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 110 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          tab === "menu" ? undefined : (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          )
        }
      >
        {tab === "menu" ? (
          <MenuView
            menu={menu}
            loading={menuLoading}
            currentTimeSlot={currentTimeSlot}
            onSelectTimeSlot={handleSelectTimeSlot}
            onSelectProduct={handleSelectProduct}
          />
        ) : null}

        {tab === "orders" ? (
          <OrdersTab
            ref={ordersTabRef}
            sessionId={session.id}
            onSelectOrder={handleSelectOrder}
          />
        ) : null}

        {tab === "bill" ? (
          <BillTab
            ref={billTabRef}
            session={session}
            onPaid={(payment) =>
              router.replace({
                pathname: "/payment-success",
                params: {
                  amount: String(payment.amount),
                  receipt: payment.receipt_number ?? "",
                  tip: String(payment.tip ?? 0),
                  discount: String(payment.discount ?? 0),
                  method: payment.method,
                  sessionPaid: payment.session_paid ? "1" : "0",
                },
              })
            }
            onOpenSplit={() => router.push("/split")}
          />
        ) : null}
      </ScrollView>

      <Pressable
        onPress={() => setWaiterModal(true)}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: colors.primary,
            bottom: insets.bottom + 24,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <Feather name="bell" size={18} color="#FFFFFF" />
        <Text style={styles.fabText}>Llamar mozo</Text>
      </Pressable>

      <Modal
        visible={waiterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setWaiterModal(false)}
      >
        <Pressable
          style={styles.sheetBackdrop}
          onPress={() => !callingWaiter && setWaiterModal(false)}
        />
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.background, paddingBottom: insets.bottom + 20 },
          ]}
        >
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          {waiterSent ? (
            <View style={styles.sentWrap}>
              <View style={[styles.sentIcon, { backgroundColor: colors.success + "22" }]}>
                <Feather name="check" size={28} color={colors.success} />
              </View>
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
                ¡Mozo en camino!
              </Text>
            </View>
          ) : (
            <>
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
                Llamar al mozo
              </Text>
              <Text style={[styles.sheetDesc, { color: colors.mutedForeground }]}>
                ¿En qué te podemos ayudar?
              </Text>
              <View style={styles.reasonList}>
                {WAITER_REASONS.map((r) => (
                  <Pressable
                    key={r.id}
                    onPress={() => callWaiter(r.id)}
                    disabled={callingWaiter}
                    style={[
                      styles.reasonChip,
                      { backgroundColor: colors.muted, borderColor: colors.border },
                    ]}
                  >
                    <Text style={[styles.reasonText, { color: colors.foreground }]}>
                      {r.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                style={[
                  styles.customInput,
                  { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted },
                ]}
                placeholder="Otro motivo (opcional)"
                placeholderTextColor={colors.mutedForeground}
                value={customReason}
                onChangeText={setCustomReason}
              />
              {customReason.trim() ? (
                <Button
                  title={callingWaiter ? "Enviando..." : "Enviar"}
                  onPress={() => callWaiter("other")}
                  loading={callingWaiter}
                  fullWidth
                />
              ) : null}
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    padding: 24,
  },
  loadingText: { fontSize: 14, textAlign: "center" },
  errTitle: { fontSize: 18, fontWeight: "700" },
  header: {
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 14,
    paddingBottom: 0,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleWrap: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700", letterSpacing: -0.3 },
  cartBadge: {
    position: "absolute",
    top: 4,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  cartBadgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  participants: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  avatarText: { fontSize: 11, fontWeight: "700" },
  participantCount: { fontSize: 13, marginLeft: 10 },
  tabs: {
    flexDirection: "row",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    gap: 8,
  },
  tabText: { fontSize: 15, fontWeight: "600" },
  tabIndicator: {
    height: 3,
    width: "60%",
    borderRadius: 2,
    position: "absolute",
    bottom: 0,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  placeholder: {
    alignItems: "center",
    paddingVertical: 70,
    gap: 12,
  },
  placeholderTitle: { fontSize: 17, fontWeight: "700" },
  placeholderDesc: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 19,
  },
  fab: {
    position: "absolute",
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  fabText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 8,
  },
  sheetTitle: { fontSize: 20, fontWeight: "700", letterSpacing: -0.3 },
  sheetDesc: { fontSize: 14 },
  reasonList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  reasonChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  reasonText: { fontSize: 14, fontWeight: "600" },
  customInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    marginTop: 4,
  },
  sentWrap: {
    alignItems: "center",
    gap: 14,
    paddingVertical: 20,
  },
  sentIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
