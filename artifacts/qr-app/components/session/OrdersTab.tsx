import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useSessionStore } from "@/stores/sessionStore";
import { orderService } from "@/services/orders";
import { getErrorMessage } from "@/services/api";
import { OrderCard } from "@/components/OrderCard";
import { getOrderStatusMeta } from "@/utils/orderStatus";
import { Order } from "@/types";

export interface OrdersTabHandle {
  refresh: () => Promise<void>;
}

interface Props {
  sessionId: string;
  onSelectOrder: (order: Order) => void;
}

export const OrdersTab = forwardRef<OrdersTabHandle, Props>(
  ({ sessionId, onSelectOrder }, ref) => {
    const colors = useColors();
    const storeOrders = useSessionStore((s) => s.orders);
    const [orders, setOrders] = useState<Order[]>(storeOrders);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
      try {
        const data = await orderService.getSessionOrders(sessionId);
        setOrders(data);
        setError(null);
      } catch (e) {
        // Fall back to locally-tracked orders when the API is unavailable.
        setOrders((prev) => (prev.length ? prev : storeOrders));
        if (storeOrders.length === 0) setError(getErrorMessage(e));
      } finally {
        setLoading(false);
      }
    }, [sessionId, storeOrders]);

    useImperativeHandle(ref, () => ({ refresh: load }), [load]);

    useEffect(() => {
      setLoading(true);
      load();
    }, [load]);

    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      );
    }

    if (orders.length === 0) {
      return (
        <View style={styles.empty}>
          <Feather name="clipboard" size={44} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Aún no hiciste ningún pedido
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
            {error ?? "Agregá productos del menú para hacer tu primer pedido"}
          </Text>
        </View>
      );
    }

    const active = orders.filter(
      (o) => getOrderStatusMeta(o.status).group === "active",
    );
    const ready = orders.filter(
      (o) => getOrderStatusMeta(o.status).group === "ready",
    );
    const done = orders.filter((o) => {
      const g = getOrderStatusMeta(o.status).group;
      return g === "done" || g === "cancelled";
    });

    const Section = ({ title, list }: { title: string; list: Order[] }) =>
      list.length > 0 ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {title}
          </Text>
          <View style={styles.list}>
            {list.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                onPress={() => onSelectOrder(o)}
              />
            ))}
          </View>
        </View>
      ) : null;

    return (
      <View>
        <Section title="En curso" list={active} />
        <Section title="Listos" list={ready} />
        <Section title="Completados" list={done} />
      </View>
    );
  },
);

OrdersTab.displayName = "OrdersTab";

const styles = StyleSheet.create({
  center: { paddingVertical: 60, alignItems: "center" },
  empty: { alignItems: "center", paddingVertical: 70, gap: 12 },
  emptyTitle: { fontSize: 17, fontWeight: "700" },
  emptyDesc: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 19,
  },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: "700", marginBottom: 12 },
  list: { gap: 12 },
});
