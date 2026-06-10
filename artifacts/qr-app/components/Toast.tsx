import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

type ToastType = "success" | "info" | "error";

interface Props {
  visible: boolean;
  message: string;
  type?: ToastType;
}

export function Toast({ visible, message, type = "info" }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible, anim]);

  const bg =
    type === "success"
      ? colors.success
      : type === "error"
        ? colors.destructive
        : colors.foreground;

  const icon =
    type === "success" ? "check-circle" : type === "error" ? "alert-circle" : "info";

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        {
          backgroundColor: bg,
          top: insets.top + 10,
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Feather name={icon} size={18} color="#FFFFFF" />
      <Text style={styles.text} numberOfLines={2}>
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  text: { color: "#FFFFFF", fontSize: 14, fontWeight: "600", flex: 1 },
});
