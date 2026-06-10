import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/Button";

interface MenuItem {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isGuest = useAuthStore((s) => s.isGuest);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const [loggingOut, setLoggingOut] = useState(false);

  const paddingTop = insets.top + (Platform.OS === "web" ? 67 : 0);
  const paddingBottom = insets.bottom + 100;

  const handleLogout = () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Seguro que querés salir?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Salir",
          style: "destructive",
          onPress: async () => {
            setLoggingOut(true);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await logout();
            setLoggingOut(false);
          },
        },
      ],
    );
  };

  const menuItems: MenuItem[] = [
    { icon: "user", label: "Mis datos", onPress: () => router.push("/profile/edit") },
    { icon: "credit-card", label: "Métodos de pago", onPress: () => router.push("/profile/payment-methods") },
    { icon: "heart", label: "Mis favoritos", onPress: () => router.push("/profile/favorites") },
    { icon: "award", label: "Puntos y recompensas", onPress: () => router.push("/profile/points") },
    { icon: "calendar", label: "Reservas", onPress: () => router.push("/profile/reservations") },
    { icon: "settings", label: "Configuración", onPress: () => router.push("/profile/settings") },
    { icon: "help-circle", label: "Soporte", onPress: () => router.push("/profile/support") },
    { icon: "log-out", label: "Cerrar sesión", onPress: handleLogout, destructive: true },
  ];

  if (isGuest || !isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: paddingTop + 16 }]}>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Perfil</Text>
        </View>
        <View style={styles.guestContent}>
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.muted }]}>
            <Feather name="user" size={40} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.guestTitle, { color: colors.foreground }]}>
            Iniciá sesión para ver tu perfil
          </Text>
          <Text style={[styles.guestDesc, { color: colors.mutedForeground }]}>
            Con una cuenta podés ver tus puntos, reservas, pedidos y mucho más.
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

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.scrollContent, { paddingBottom }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: paddingTop + 16 }]}>
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Perfil</Text>
      </View>

      <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: colors.foreground }]}>
            {user?.full_name}
          </Text>
          <Text style={[styles.profileEmail, { color: colors.mutedForeground }]}>
            {user?.email}
          </Text>
        </View>
        <View style={[styles.pointsCard, { backgroundColor: colors.primary + "15" }]}>
          <Feather name="award" size={18} color={colors.primary} />
          <Text style={[styles.pointsNumber, { color: colors.primary }]}>
            {user?.points ?? 0}
          </Text>
          <Text style={[styles.pointsLabel, { color: colors.primary }]}>
            puntos
          </Text>
        </View>
      </View>

      <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {menuItems.map((item, i) => (
          <React.Fragment key={item.label}>
            <Pressable
              style={({ pressed }) => [
                styles.menuRow,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={item.onPress}
              disabled={item.label === "Cerrar sesión" && loggingOut}
            >
              <View
                style={[
                  styles.menuIcon,
                  {
                    backgroundColor: item.destructive
                      ? colors.destructive + "15"
                      : colors.muted,
                  },
                ]}
              >
                <Feather
                  name={item.icon}
                  size={18}
                  color={item.destructive ? colors.destructive : colors.foreground}
                />
              </View>
              <Text
                style={[
                  styles.menuLabel,
                  {
                    color: item.destructive
                      ? colors.destructive
                      : colors.foreground,
                    flex: 1,
                  },
                ]}
              >
                {item.label}
              </Text>
              {!item.destructive ? (
                <Feather
                  name="chevron-right"
                  size={16}
                  color={colors.mutedForeground}
                />
              ) : null}
            </Pressable>
            {i < menuItems.length - 1 ? (
              <View
                style={[styles.menuDivider, { backgroundColor: colors.border }]}
              />
            ) : null}
          </React.Fragment>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  header: {
    paddingBottom: 4,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  profileCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "600",
  },
  profileEmail: {
    fontSize: 13,
  },
  pointsCard: {
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    gap: 2,
    minWidth: 64,
  },
  pointsNumber: {
    fontSize: 18,
    fontWeight: "700",
  },
  pointsLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  menuCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  menuDivider: {
    height: 1,
    marginLeft: 66,
  },
  guestContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 60,
    gap: 14,
  },
  avatarPlaceholder: {
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
