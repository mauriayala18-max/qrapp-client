import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import { useColors } from "@/hooks/useColors";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Toast } from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import {
  FontSizePref,
  Language,
  useSettingsStore,
} from "@/stores/settingsStore";
import { useAuthStore } from "@/stores/authStore";
import { profileService } from "@/services/profile";
import { getErrorMessage } from "@/services/api";

const LANGUAGES: { value: Language; label: string }[] = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
  { value: "pt", label: "Português" },
];

const FONT_SIZES: { value: FontSizePref; label: string }[] = [
  { value: "small", label: "Pequeño" },
  { value: "normal", label: "Normal" },
  { value: "large", label: "Grande" },
];

const TERMS_URL = "https://qrapp.com/terminos";
const PRIVACY_URL = "https://qrapp.com/privacidad";

function SegmentedRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const colors = useColors();
  return (
    <View style={[styles.segment, { backgroundColor: colors.muted }]}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            style={[
              styles.segmentItem,
              active && { backgroundColor: colors.background },
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(opt.value);
            }}
          >
            <Text
              style={[
                styles.segmentText,
                { color: active ? colors.primary : colors.mutedForeground },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { toast, showToast } = useToast();

  const language = useSettingsStore((s) => s.language);
  const darkMode = useSettingsStore((s) => s.darkMode);
  const fontSize = useSettingsStore((s) => s.fontSize);
  const hydrate = useSettingsStore((s) => s.hydrate);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const setDarkMode = useSettingsStore((s) => s.setDarkMode);
  const setFontSize = useSettingsStore((s) => s.setFontSize);

  const logout = useAuthStore((s) => s.logout);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const openLink = (url: string) => {
    WebBrowser.openBrowserAsync(url).catch(() => {});
  };

  const confirmDelete = () => {
    Alert.alert(
      "Eliminar mi cuenta",
      "Esta acción es permanente. Se borrarán tus datos, puntos, reservas e historial. ¿Querés continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await profileService.deleteAccount();
              await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Warning,
              );
              await logout();
            } catch (e) {
              showToast(getErrorMessage(e), "error");
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Toast
        visible={!!toast}
        message={toast?.message ?? ""}
        type={toast?.type}
      />
      <ScreenHeader title="Configuración" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.label, { color: colors.foreground }]}>Idioma</Text>
        <SegmentedRow
          options={LANGUAGES}
          value={language}
          onChange={setLanguage}
        />

        <Text style={[styles.label, { color: colors.foreground }]}>
          Tamaño de texto
        </Text>
        <SegmentedRow
          options={FONT_SIZES}
          value={fontSize}
          onChange={setFontSize}
        />

        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: colors.muted }]}>
              <Feather name="moon" size={18} color={colors.foreground} />
            </View>
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>
              Modo oscuro
            </Text>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Pressable
            style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => router.push("/profile/notification-settings")}
          >
            <View style={[styles.rowIcon, { backgroundColor: colors.muted }]}>
              <Feather name="bell" size={18} color={colors.foreground} />
            </View>
            <Text
              style={[styles.rowLabel, { color: colors.foreground, flex: 1 }]}
            >
              Notificaciones
            </Text>
            <Feather
              name="chevron-right"
              size={16}
              color={colors.mutedForeground}
            />
          </Pressable>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Pressable
            style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => openLink(TERMS_URL)}
          >
            <View style={[styles.rowIcon, { backgroundColor: colors.muted }]}>
              <Feather name="file-text" size={18} color={colors.foreground} />
            </View>
            <Text
              style={[styles.rowLabel, { color: colors.foreground, flex: 1 }]}
            >
              Términos y condiciones
            </Text>
            <Feather
              name="external-link"
              size={16}
              color={colors.mutedForeground}
            />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Pressable
            style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => openLink(PRIVACY_URL)}
          >
            <View style={[styles.rowIcon, { backgroundColor: colors.muted }]}>
              <Feather name="shield" size={18} color={colors.foreground} />
            </View>
            <Text
              style={[styles.rowLabel, { color: colors.foreground, flex: 1 }]}
            >
              Política de privacidad
            </Text>
            <Feather
              name="external-link"
              size={16}
              color={colors.mutedForeground}
            />
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.deleteBtn,
            {
              borderColor: colors.destructive,
              opacity: pressed || deleting ? 0.6 : 1,
            },
          ]}
          onPress={confirmDelete}
          disabled={deleting}
        >
          <Feather name="trash-2" size={18} color={colors.destructive} />
          <Text style={[styles.deleteText, { color: colors.destructive }]}>
            {deleting ? "Eliminando…" : "Eliminar mi cuenta"}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, gap: 12 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
  segment: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: "center",
  },
  segmentText: { fontSize: 14, fontWeight: "600" },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { fontSize: 15, fontWeight: "500" },
  divider: { height: 1, marginLeft: 68 },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 15,
    marginTop: 16,
  },
  deleteText: { fontSize: 15, fontWeight: "600" },
});
