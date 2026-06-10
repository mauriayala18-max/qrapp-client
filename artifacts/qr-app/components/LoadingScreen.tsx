import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

export default function LoadingScreen() {
  const colors = useColors();
  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <View style={styles.logoBox}>
        <Text style={styles.logoText}>QR</Text>
        <Text style={[styles.logoSub, { color: colors.primaryForeground }]}>
          App
        </Text>
      </View>
      <ActivityIndicator
        size="large"
        color={colors.primaryForeground}
        style={styles.spinner}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoBox: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoText: {
    fontSize: 64,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -2,
  },
  logoSub: {
    fontSize: 22,
    fontWeight: "500",
    marginTop: -8,
    letterSpacing: 6,
  },
  spinner: {
    marginTop: 16,
  },
});
