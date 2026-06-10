import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import { useAuthStore } from "@/stores/authStore";
import { getErrorMessage } from "@/services/api";
import { UpdateProfileData } from "@/types";

const DIETARY = [
  "Sin restricciones",
  "Celíaco",
  "Vegetariano",
  "Vegano",
  "Intolerante a la lactosa",
  "Alérgico a frutos secos",
  "Alérgico al marisco",
  "Diabético",
];

const CUISINES = [
  "Paraguaya",
  "Argentina",
  "Brasileña",
  "Italiana",
  "Japonesa",
  "China",
  "Mexicana",
  "Peruana",
  "Americana",
  "Española",
  "Francesa",
  "Árabe",
];

const FREQUENCIES = [
  "Raramente",
  "Una vez al mes",
  "Una vez por semana",
  "Varias veces por semana",
];

type ModalKind = "dietary" | "cuisines" | "frequency" | null;

export default function EditProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { toast, showToast } = useToast();

  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [dob, setDob] = useState("");
  const [dietary, setDietary] = useState<string[]>(
    user?.dietary_restrictions ?? [],
  );
  const [cuisines, setCuisines] = useState<string[]>(
    user?.favorite_cuisines ?? [],
  );
  const [frequency, setFrequency] = useState(user?.dining_frequency ?? "");

  const [modal, setModal] = useState<ModalKind>(null);
  const [saving, setSaving] = useState(false);

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  const toggleFrom = (
    list: string[],
    setList: (v: string[]) => void,
    value: string,
  ) => {
    Haptics.selectionAsync();
    setList(
      list.includes(value)
        ? list.filter((v) => v !== value)
        : [...list, value],
    );
  };

  const save = async () => {
    if (!fullName.trim()) {
      showToast("Ingresá tu nombre", "error");
      return;
    }
    setSaving(true);
    try {
      const payload: UpdateProfileData & { date_of_birth?: string } = {
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
        dietary_restrictions: dietary,
        favorite_cuisines: cuisines,
        dining_frequency: frequency || undefined,
        ...(dob.trim() ? { date_of_birth: dob.trim() } : {}),
      };
      await updateProfile(payload);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Cambios guardados", "success");
    } catch (e) {
      showToast(getErrorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  const summary = (list: string[]) =>
    list.length === 0
      ? "Ninguna seleccionada"
      : list.length <= 2
        ? list.join(", ")
        : `${list.slice(0, 2).join(", ")} +${list.length - 2}`;

  const modalConfig =
    modal === "dietary"
      ? {
          title: "Preferencias alimentarias",
          options: DIETARY,
          selected: dietary,
          onToggle: (v: string) => toggleFrom(dietary, setDietary, v),
          multi: true,
        }
      : modal === "cuisines"
        ? {
            title: "Cocinas favoritas",
            options: CUISINES,
            selected: cuisines,
            onToggle: (v: string) => toggleFrom(cuisines, setCuisines, v),
            multi: true,
          }
        : modal === "frequency"
          ? {
              title: "Frecuencia",
              options: FREQUENCIES,
              selected: frequency ? [frequency] : [],
              onToggle: (v: string) => {
                Haptics.selectionAsync();
                setFrequency(v);
                setModal(null);
              },
              multi: false,
            }
          : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Toast
        visible={!!toast}
        message={toast?.message ?? ""}
        type={toast?.type}
      />
      <ScreenHeader title="Mis datos" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 120 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.avatarWrap}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              {user?.photo ? null : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
            </View>
            <Text style={[styles.photoHint, { color: colors.mutedForeground }]}>
              Tu foto se sincroniza con tu cuenta
            </Text>
          </View>

          <Input
            label="Nombre completo"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Tu nombre"
            leftIcon="user"
          />
          <Input
            label="Teléfono"
            value={phone}
            onChangeText={setPhone}
            placeholder="Ej: 0981 123 456"
            keyboardType="phone-pad"
            leftIcon="phone"
          />
          <Input
            label="Fecha de nacimiento"
            value={dob}
            onChangeText={setDob}
            placeholder="DD/MM/AAAA"
            keyboardType="numbers-and-punctuation"
            leftIcon="calendar"
          />

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
              Correo electrónico
            </Text>
            <View
              style={[
                styles.readonlyRow,
                { backgroundColor: colors.muted, borderColor: colors.border },
              ]}
            >
              <Feather name="mail" size={18} color={colors.mutedForeground} />
              <Text
                style={[styles.readonlyText, { color: colors.mutedForeground }]}
                numberOfLines={1}
              >
                {user?.email ?? "—"}
              </Text>
              <Feather name="lock" size={15} color={colors.mutedForeground} />
            </View>
          </View>

          <SelectRow
            label="Preferencias alimentarias"
            value={summary(dietary)}
            icon="coffee"
            onPress={() => setModal("dietary")}
          />
          <SelectRow
            label="Cocinas favoritas"
            value={summary(cuisines)}
            icon="heart"
            onPress={() => setModal("cuisines")}
          />
          <SelectRow
            label="Frecuencia"
            value={frequency || "Sin definir"}
            icon="clock"
            onPress={() => setModal("frequency")}
          />
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom + 12,
            },
          ]}
        >
          <Button
            title="Guardar cambios"
            onPress={save}
            loading={saving}
            fullWidth
            size="lg"
          />
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={!!modalConfig}
        transparent
        animationType="slide"
        onRequestClose={() => setModal(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setModal(null)}>
          <Pressable
            style={[
              styles.sheet,
              {
                backgroundColor: colors.background,
                paddingBottom: insets.bottom + 16,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle}>
              <View
                style={[styles.handleBar, { backgroundColor: colors.border }]}
              />
            </View>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
                {modalConfig?.title}
              </Text>
              <Pressable onPress={() => setModal(null)} hitSlop={10}>
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <ScrollView
              style={styles.sheetScroll}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.chipWrap}>
                {modalConfig?.options.map((opt) => {
                  const active = modalConfig.selected.includes(opt);
                  return (
                    <Pressable
                      key={opt}
                      onPress={() => modalConfig.onToggle(opt)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: active
                            ? colors.primary
                            : colors.muted,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: active ? "#FFFFFF" : colors.foreground,
                          },
                        ]}
                      >
                        {opt}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
            {modalConfig?.multi ? (
              <Button
                title="Listo"
                onPress={() => setModal(null)}
                fullWidth
                style={{ marginTop: 8 }}
              />
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function SelectRow({
  label,
  value,
  icon,
  onPress,
}: {
  label: string;
  value: string;
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.selectRow,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
      onPress={onPress}
    >
      <View style={[styles.selectIcon, { backgroundColor: colors.muted }]}>
        <Feather name={icon} size={18} color={colors.foreground} />
      </View>
      <View style={styles.selectText}>
        <Text style={[styles.selectLabel, { color: colors.foreground }]}>
          {label}
        </Text>
        <Text
          style={[styles.selectValue, { color: colors.mutedForeground }]}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, gap: 16 },
  avatarWrap: { alignItems: "center", gap: 10, marginBottom: 4 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#FFFFFF", fontSize: 28, fontWeight: "700" },
  photoHint: { fontSize: 12 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 14, fontWeight: "500" },
  readonlyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  readonlyText: { flex: 1, fontSize: 15 },
  selectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  selectIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  selectText: { flex: 1, gap: 2 },
  selectLabel: { fontSize: 15, fontWeight: "600" },
  selectValue: { fontSize: 13 },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    maxHeight: "80%",
  },
  sheetHandle: { alignItems: "center", paddingVertical: 10 },
  handleBar: { width: 40, height: 4, borderRadius: 2 },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 18, fontWeight: "700" },
  sheetScroll: { flexGrow: 0 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontSize: 14, fontWeight: "500" },
});
