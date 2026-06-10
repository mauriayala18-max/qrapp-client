import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { ScreenHeader } from "@/components/ScreenHeader";

export default function PaymentMethodsScreen() {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Métodos de pago" />
      <View style={styles.center}>
        <View style={[styles.icon, { backgroundColor: colors.muted }]}>
          <Feather name="credit-card" size={36} color={colors.mutedForeground} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Próximamente
        </Text>
        <Text style={[styles.desc, { color: colors.mutedForeground }]}>
          Pronto vas a poder guardar tus tarjetas y métodos de pago para pagar
          más rápido.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 14,
    paddingBottom: 80,
  },
  icon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  title: { fontSize: 20, fontWeight: "700", letterSpacing: -0.3 },
  desc: { fontSize: 14, textAlign: "center", lineHeight: 20 },
});
