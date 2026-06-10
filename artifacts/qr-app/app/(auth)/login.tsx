import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getErrorMessage } from "@/services/api";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const setGuest = useAuthStore((s) => s.setGuest);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [termsModal, setTermsModal] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Completá todos los campos");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Ingresá un email válido");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result = await login(email.trim().toLowerCase(), password);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (result.needsTerms) {
        setTermsModal(true);
      }
    } catch (e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = getErrorMessage(e);
      setError(
        msg === "Error desconocido"
          ? "Email o contraseña incorrectos"
          : msg,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    setGuest();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20),
            paddingBottom: insets.bottom + 32,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
            <Text style={styles.logoText}>QR</Text>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Bienvenido
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Iniciá sesión para continuar
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="tu@email.com"
            value={email}
            onChangeText={(t) => { setEmail(t); setError(""); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            leftIcon="mail"
          />
          <Input
            label="Contraseña"
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChangeText={(t) => { setPassword(t); setError(""); }}
            secureToggle
            autoComplete="password"
            leftIcon="lock"
          />

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: "#FFF0EE", borderColor: colors.destructive }]}>
              <Text style={[styles.errorText, { color: colors.destructive }]}>
                {error}
              </Text>
            </View>
          ) : null}

          <Button
            title="Iniciar sesión"
            onPress={handleLogin}
            loading={loading}
            fullWidth
            size="lg"
            style={{ marginTop: 8 }}
          />
        </View>

        <View style={styles.footer}>
          <Pressable onPress={() => router.push("/(auth)/register")} hitSlop={8}>
            <Text style={[styles.link, { color: colors.mutedForeground }]}>
              ¿No tenés cuenta?{" "}
              <Text style={{ color: colors.primary, fontWeight: "600" }}>
                Registrate
              </Text>
            </Text>
          </Pressable>

          <View style={[styles.divider, { borderColor: colors.border }]}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>
              o
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <Pressable onPress={handleGuest} hitSlop={8}>
            <Text style={[styles.guestLink, { color: colors.mutedForeground }]}>
              Continuar como invitado
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal visible={termsModal} transparent animationType="slide" onRequestClose={() => setTermsModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Términos y condiciones
            </Text>
            <Text style={[styles.modalDesc, { color: colors.mutedForeground }]}>
              Para continuar, necesitás aceptar nuestros términos y condiciones de uso y política de privacidad.
            </Text>
            <Button
              title="Aceptar y continuar"
              onPress={() => setTermsModal(false)}
              fullWidth
              size="lg"
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
    gap: 8,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  logoText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
  },
  form: {
    gap: 16,
  },
  errorBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  footer: {
    marginTop: 32,
    alignItems: "center",
    gap: 16,
  },
  link: {
    fontSize: 14,
    textAlign: "center",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
  },
  guestLink: {
    fontSize: 14,
    textDecorationLine: "underline",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 16,
    alignItems: "center",
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  modalDesc: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
