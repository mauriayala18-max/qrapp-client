import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { Button } from "@/components/ui/Button";

interface GuestModalProps {
  visible: boolean;
  onClose: () => void;
  message?: string;
}

export function GuestModal({ visible, onClose, message }: GuestModalProps) {
  const colors = useColors();
  const router = useRouter();

  const goLogin = () => {
    onClose();
    router.push("/(auth)/login");
  };

  const goRegister = () => {
    onClose();
    router.push("/(auth)/register");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <View style={[styles.iconBox, { backgroundColor: colors.muted }]}>
            <Feather name="lock" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Iniciá sesión para continuar
          </Text>
          <Text style={[styles.desc, { color: colors.mutedForeground }]}>
            {message ??
              "Para acceder a esta función necesitás una cuenta. Es gratis y rápido."}
          </Text>
          <View style={styles.actions}>
            <Button
              title="Iniciá sesión"
              onPress={goLogin}
              variant="primary"
              fullWidth
            />
            <Button
              title="Crear cuenta"
              onPress={goRegister}
              variant="outline"
              fullWidth
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    alignItems: "center",
    gap: 16,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  desc: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  actions: {
    width: "100%",
    gap: 10,
    marginTop: 8,
  },
});
