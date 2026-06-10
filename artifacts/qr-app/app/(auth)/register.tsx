import React, { useState } from "react";
import {
  KeyboardAvoidingView,
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
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getErrorMessage } from "@/services/api";

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const register = useAuthStore((s) => s.register);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [globalError, setGlobalError] = useState("");

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!fullName.trim()) newErrors.fullName = "Ingresá tu nombre completo";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) newErrors.email = "Ingresá tu email";
    else if (!emailRegex.test(email.trim())) newErrors.email = "Email inválido";
    if (!password) newErrors.password = "Ingresá una contraseña";
    else if (password.length < 8) newErrors.password = "Mínimo 8 caracteres";
    if (!confirmPassword) newErrors.confirmPassword = "Confirmá tu contraseña";
    else if (password !== confirmPassword) newErrors.confirmPassword = "Las contraseñas no coinciden";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setGlobalError("");
    setLoading(true);
    try {
      await register({ full_name: fullName.trim(), email: email.trim().toLowerCase(), password });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setGlobalError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const clearError = (field: keyof FormErrors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setGlobalError("");
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
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12),
            paddingBottom: insets.bottom + 32,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: colors.muted }]}
            hitSlop={8}
          >
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </Pressable>
        </View>

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Crear cuenta
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Registrate gratis y empezá a pedir
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Nombre completo"
            placeholder="Juan Pérez"
            value={fullName}
            onChangeText={(t) => { setFullName(t); clearError("fullName"); }}
            autoCapitalize="words"
            autoComplete="name"
            leftIcon="user"
            error={errors.fullName}
          />
          <Input
            label="Email"
            placeholder="tu@email.com"
            value={email}
            onChangeText={(t) => { setEmail(t); clearError("email"); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            leftIcon="mail"
            error={errors.email}
          />
          <Input
            label="Contraseña"
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChangeText={(t) => { setPassword(t); clearError("password"); }}
            secureToggle
            autoComplete="new-password"
            leftIcon="lock"
            error={errors.password}
            hint="Mínimo 8 caracteres"
          />
          <Input
            label="Confirmá tu contraseña"
            placeholder="Repetí la contraseña"
            value={confirmPassword}
            onChangeText={(t) => { setConfirmPassword(t); clearError("confirmPassword"); }}
            secureToggle
            leftIcon="lock"
            error={errors.confirmPassword}
          />

          {globalError ? (
            <View style={[styles.errorBox, { backgroundColor: "#FFF0EE", borderColor: colors.destructive }]}>
              <Text style={[styles.errorText, { color: colors.destructive }]}>
                {globalError}
              </Text>
            </View>
          ) : null}

          <Button
            title="Crear cuenta"
            onPress={handleRegister}
            loading={loading}
            fullWidth
            size="lg"
            style={{ marginTop: 8 }}
          />
        </View>

        <View style={styles.footer}>
          <Pressable onPress={() => router.push("/(auth)/login")} hitSlop={8}>
            <Text style={[styles.link, { color: colors.mutedForeground }]}>
              ¿Ya tenés cuenta?{" "}
              <Text style={{ color: colors.primary, fontWeight: "600" }}>
                Iniciá sesión
              </Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  topRow: {
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    marginBottom: 32,
    gap: 6,
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
  },
  link: {
    fontSize: 14,
    textAlign: "center",
  },
});
