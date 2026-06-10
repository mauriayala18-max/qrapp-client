import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useSessionStore } from "@/stores/sessionStore";
import { orderService } from "@/services/orders";
import { getErrorMessage } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/Toast";
import { formatGs } from "@/utils/format";
import {
  STATUS_FLOW,
  getOrderStatusMeta,
  getStatusStep,
  estimatedPrepMinutes,
} from "@/utils/orderStatus";
import { Order } from "@/types";

const POLL_MS = 10000;

export default function OrderScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const session = useSessionStore((s) => s.session);
  const updateOrderStatus = useSessionStore((s) => s.updateOrderStatus);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const scale = useRef(new Animated.Value(0)).current;
  const prevStatus = useRef<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  useEffect(() => {
    let active = true;
    let interval: ReturnType<typeof setInterval> | null = null;

    const fetchOrder = async (isPoll: boolean) => {
      if (!orderId) return;
      try {
        const data = await orderService.getOrder(orderId);
        if (!active) return;
        if (
          isPoll &&
          prevStatus.current &&
          data.status !== prevStatus.current
        ) {
          const meta = getOrderStatusMeta(data.status);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          showToast(`Estado actualizado: ${meta.label}`);
          updateOrderStatus(data.id, data.status);
        }
        prevStatus.current = data.status;
        setOrder(data);
        setError(null);
        const group = getOrderStatusMeta(data.status).group;
        if ((group === "done" || group === "cancelled") && interval) {
          clearInterval(interval);
          interval = null;
        }
      } catch (e) {
        if (active && !order) setError(getErrorMessage(e));
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchOrder(false);
    interval = setInterval(() => fetchOrder(true), POLL_MS);

    return () => {
      active = false;
      if (interval) clearInterval(interval);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const backToMenu = () => {
    if (session) router.replace(`/session/${session.id}`);
    else router.replace("/(tabs)");
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="alert-circle" size={44} color={colors.border} />
        <Text style={[styles.errTitle, { color: colors.foreground }]}>
          No pudimos cargar el pedido
        </Text>
        {error ? (
          <Text style={[styles.errDesc, { color: colors.mutedForeground }]}>
            {error}
          </Text>
        ) : null}
        <Button title="Volver al menú" onPress={backToMenu} />
      </View>
    );
  }

  const step = getStatusStep(order.status);
  const meta = getOrderStatusMeta(order.status);
  const isCancelled = meta.group === "cancelled";
  const orderNumber = `#${order.id.slice(-6).toUpperCase()}`;
  const eta = estimatedPrepMinutes(order);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Toast visible={!!toast} message={toast ?? ""} type="info" />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.checkCircle,
            {
              backgroundColor: isCancelled
                ? colors.destructive + "1A"
                : colors.success + "1A",
              transform: [{ scale }],
            },
          ]}
        >
          <Feather
            name={isCancelled ? "x" : "check"}
            size={48}
            color={isCancelled ? colors.destructive : colors.success}
          />
        </Animated.View>

        <Text style={[styles.title, { color: colors.foreground }]}>
          {isCancelled ? "Pedido cancelado" : "¡Pedido confirmado!"}
        </Text>
        <Text style={[styles.orderNum, { color: colors.mutedForeground }]}>
          Pedido {orderNumber}
        </Text>

        {!isCancelled ? (
          <View style={[styles.etaPill, { backgroundColor: colors.muted }]}>
            <Feather name="clock" size={15} color={colors.primary} />
            <Text style={[styles.etaText, { color: colors.foreground }]}>
              Tiempo estimado ~{eta} min
            </Text>
          </View>
        ) : null}

        {/* Status progress */}
        {!isCancelled ? (
          <View style={styles.progress}>
            {STATUS_FLOW.map((s, i) => {
              const reached = i <= step;
              return (
                <View key={i} style={styles.progressStep}>
                  <View style={styles.progressDotWrap}>
                    {i > 0 ? (
                      <View
                        style={[
                          styles.progressLine,
                          { backgroundColor: i <= step ? s.color : colors.border },
                        ]}
                      />
                    ) : null}
                    <View
                      style={[
                        styles.progressDot,
                        {
                          backgroundColor: reached ? s.color : colors.background,
                          borderColor: reached ? s.color : colors.border,
                        },
                      ]}
                    >
                      {reached ? (
                        <Feather name="check" size={12} color="#FFFFFF" />
                      ) : null}
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.progressLabel,
                      { color: reached ? colors.foreground : colors.mutedForeground },
                    ]}
                  >
                    {s.label}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : null}

        {/* Items */}
        <View style={[styles.card, { borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            Tu pedido
          </Text>
          {order.items.map((it, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={[styles.itemName, { color: colors.mutedForeground }]} numberOfLines={1}>
                {it.quantity}× {it.product?.name ?? "Producto"}
              </Text>
              <Text style={[styles.itemPrice, { color: colors.foreground }]}>
                {formatGs((it.unit_price ?? 0) * it.quantity)}
              </Text>
            </View>
          ))}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.itemRow}>
            <Text style={[styles.totalLabel, { color: colors.foreground }]}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>
              {formatGs(order.total)}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button title="Volver al menú" fullWidth size="lg" onPress={backToMenu} />
          <Pressable onPress={() => router.push("/(tabs)/orders")} style={styles.link}>
            <Text style={[styles.linkText, { color: colors.primary }]}>
              Ver todos mis pedidos
            </Text>
          </Pressable>
        </View>
      </ScrollView>
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
  errTitle: { fontSize: 18, fontWeight: "700" },
  errDesc: { fontSize: 14, textAlign: "center" },
  content: {
    paddingHorizontal: 20,
    alignItems: "center",
  },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  orderNum: { fontSize: 15, marginTop: 6, fontWeight: "600" },
  etaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    marginTop: 18,
  },
  etaText: { fontSize: 14, fontWeight: "600" },
  progress: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 30,
    paddingHorizontal: 8,
  },
  progressStep: { flex: 1, alignItems: "center" },
  progressDotWrap: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  progressLine: {
    position: "absolute",
    height: 3,
    right: "50%",
    left: "-50%",
    top: 12,
  },
  progressDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  progressLabel: { fontSize: 12, fontWeight: "600", marginTop: 8, textAlign: "center" },
  card: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 10,
    marginTop: 32,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  itemName: { fontSize: 14, flex: 1 },
  itemPrice: { fontSize: 14, fontWeight: "600" },
  divider: { height: 1, marginVertical: 2 },
  totalLabel: { fontSize: 16, fontWeight: "700" },
  totalValue: { fontSize: 18, fontWeight: "800" },
  actions: { width: "100%", marginTop: 28, gap: 8 },
  link: { alignSelf: "center", paddingVertical: 10 },
  linkText: { fontSize: 15, fontWeight: "600" },
});
