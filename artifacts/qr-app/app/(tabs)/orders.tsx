import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuthStore } from "@/stores/authStore";
import { orderService } from "@/services/orders";
import { OrderCard } from "@/components/OrderCard";
import { Button } from "@/components/ui/Button";
import { isActiveOrder } from "@/utils/orderStatus";
import { Order } from "@/types";

function EmptyState({
  icon,
  title,
  desc,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  desc: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.emptyCard}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
        <Feather name={icon} size={24} color={colors.mutedForeground} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>{desc}</Text>
    </View>
  );
}

export default function OrdersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isGuest = useAuthStore((s) => s.isGuest);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const paddingTop = insets.top + (Platform.OS === "web" ? 67 : 0);
  const paddingBottom = insets.bottom + 100;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const canLoad = isAuthenticated && !isGuest;

  const load = useCallback(async () => {
    if (!canLoad) {
      setLoading(false);
      return;
    }
    try {
      const data = await orderService.getMyOrders();
      setOrders(data);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [canLoad]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  if (isGuest || !isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: paddingTop + 16 }]}>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Pedidos</Text>
        </View>
        <View style={styles.guestContent}>
          <View style={[styles.guestIcon, { backgroundColor: colors.muted }]}>
            <Feather name="shopping-bag" size={40} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.guestTitle, { color: colors.foreground }]}>
            Iniciá sesión para ver tus pedidos
          </Text>
          <Text style={[styles.guestDesc, { color: colors.mutedForeground }]}>
            Con una cuenta podés ver tus pedidos activos e historial completo.
          </Text>
          <View style={styles.guestActions}>
            <Button
              title="Iniciá sesión"
              onPress={() => router.push("/(auth)/login")}
              fullWidth
              size="lg"
            />
            <Button
              title="Crear cuenta"
              onPress={() => router.push("/(auth)/register")}
              variant="outline"
              fullWidth
            />
          </View>
        </View>
      </View>
    );
  }

  const active = orders.filter((o) => isActiveOrder(o.status));
  const history = orders.filter((o) => !isActiveOrder(o.status));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: paddingTop + 16 }]}>
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Pedidos</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Pedidos activos
            </Text>
            {active.length > 0 ? (
              <View style={styles.list}>
                {active.map((o) => (
                  <OrderCard
                    key={o.id}
                    order={o}
                    showRestaurant
                    onPress={() => router.push(`/order/${o.id}`)}
                  />
                ))}
              </View>
            ) : (
              <EmptyState
                icon="clock"
                title="Sin pedidos activos"
                desc="Escaneá el QR de tu mesa para empezar a pedir"
              />
            )}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Historial
            </Text>
            {history.length > 0 ? (
              <View style={styles.list}>
                {history.map((o) => (
                  <OrderCard
                    key={o.id}
                    order={o}
                    showRestaurant
                    onPress={() => router.push(`/order/${o.id}`)}
                  />
                ))}
              </View>
            ) : (
              <EmptyState
                icon="list"
                title="Todavía no hiciste pedidos"
                desc="Tu historial aparecerá acá después de tu primer pedido"
              />
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scrollContent: {
    paddingHorizontal: 20,
  },
  section: {
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 14,
  },
  list: { gap: 12 },
  emptyCard: {
    alignItems: "center",
    paddingVertical: 28,
    gap: 10,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 24,
  },
  divider: {
    height: 1,
    marginHorizontal: -20,
  },
  guestContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 60,
    gap: 14,
  },
  guestIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  guestDesc: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  guestActions: {
    width: "100%",
    gap: 10,
    marginTop: 8,
  },
});
