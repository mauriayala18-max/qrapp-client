import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { Order } from "@/types";
import { formatGs, formatTimeAgo } from "@/utils/format";
import { OrderStatusBadge } from "./OrderStatusBadge";

interface Props {
  order: Order;
  onPress?: () => void;
  showRestaurant?: boolean;
}

export function OrderCard({ order, onPress, showRestaurant }: Props) {
  const colors = useColors();

  const itemCount = order.items.reduce((acc, i) => acc + i.quantity, 0);
  const summary = order.items
    .map((i) => `${i.quantity}× ${i.product?.name ?? "Producto"}`)
    .join(" · ");

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.top}>
        <OrderStatusBadge status={order.status} size="sm" />
        <Text style={[styles.time, { color: colors.mutedForeground }]}>
          {formatTimeAgo(order.created_at)}
        </Text>
      </View>

      {showRestaurant && order.restaurant?.name ? (
        <Text style={[styles.restaurant, { color: colors.foreground }]} numberOfLines={1}>
          {order.restaurant.name}
        </Text>
      ) : null}

      <Text style={[styles.summary, { color: colors.mutedForeground }]} numberOfLines={2}>
        {summary || `${itemCount} ítem${itemCount !== 1 ? "s" : ""}`}
      </Text>

      <View style={styles.bottom}>
        <Text style={[styles.count, { color: colors.mutedForeground }]}>
          {itemCount} ítem{itemCount !== 1 ? "s" : ""}
        </Text>
        <View style={styles.totalWrap}>
          <Text style={[styles.total, { color: colors.foreground }]}>
            {formatGs(order.total)}
          </Text>
          {onPress ? (
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  time: { fontSize: 12 },
  restaurant: { fontSize: 15, fontWeight: "700" },
  summary: { fontSize: 13, lineHeight: 18 },
  bottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  count: { fontSize: 13 },
  totalWrap: { flexDirection: "row", alignItems: "center", gap: 2 },
  total: { fontSize: 16, fontWeight: "800" },
});
