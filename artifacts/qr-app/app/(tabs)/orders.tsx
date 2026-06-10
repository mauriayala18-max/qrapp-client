import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/Button";

function EmptyState({ icon, title, desc }: { icon: keyof typeof Feather.glyphMap; title: string; desc: string }) {
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: paddingTop + 16 }]}>
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Pedidos</Text>
      </View>

      <View style={[styles.scrollContent, { paddingBottom }]}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Pedidos activos
          </Text>
          <EmptyState
            icon="clock"
            title="Sin pedidos activos"
            desc="Escaneá el QR de tu mesa para empezar a pedir"
          />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Historial
          </Text>
          <EmptyState
            icon="list"
            title="Todavía no hiciste pedidos"
            desc="Tu historial aparecerá acá después de tu primer pedido"
          />
        </View>
      </View>
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
  scrollContent: {
    flex: 1,
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
