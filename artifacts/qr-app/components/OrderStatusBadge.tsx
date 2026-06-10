import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { getOrderStatusMeta } from "@/utils/orderStatus";

interface Props {
  status?: string | null;
  size?: "sm" | "md";
}

export function OrderStatusBadge({ status, size = "md" }: Props) {
  const meta = getOrderStatusMeta(status);
  const pulse = useRef(new Animated.Value(1)).current;
  const isActive = meta.group === "active";
  const isReady = meta.group === "ready";
  const isDone = meta.group === "done";

  useEffect(() => {
    if (!isActive) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isActive, pulse]);

  const fontSize = size === "sm" ? 11 : 13;
  const dot = size === "sm" ? 7 : 9;

  return (
    <View style={[styles.badge, { backgroundColor: meta.color + "1A" }]}>
      {isReady || isDone ? (
        <Feather name="check" size={dot + 4} color={meta.color} />
      ) : (
        <Animated.View
          style={[
            styles.dot,
            { width: dot, height: dot, borderRadius: dot / 2, backgroundColor: meta.color, opacity: pulse },
          ]}
        />
      )}
      <Text style={[styles.label, { color: meta.color, fontSize }]}>
        {meta.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  dot: {},
  label: { fontWeight: "700" },
});
