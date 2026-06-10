import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Toast } from "@/components/Toast";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";
import {
  NotificationPreferences,
  notificationService,
} from "@/services/notifications";
import { getErrorMessage } from "@/services/api";

const ROWS: {
  key: keyof NotificationPreferences;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  desc: string;
}[] = [
  {
    key: "order_status",
    icon: "shopping-bag",
    label: "Estado de pedidos",
    desc: "Avisos cuando cambia el estado de tu pedido",
  },
  {
    key: "payment",
    icon: "credit-card",
    label: "Pagos",
    desc: "Confirmaciones y recibos de pago",
  },
  {
    key: "reservation",
    icon: "calendar",
    label: "Reservas",
    desc: "Confirmaciones y recordatorios de reservas",
  },
  {
    key: "points",
    icon: "award",
    label: "Puntos y recompensas",
    desc: "Cuando ganás o canjeás puntos",
  },
  {
    key: "promotion",
    icon: "tag",
    label: "Promociones",
    desc: "Ofertas y novedades de los restaurantes",
  },
  {
    key: "system",
    icon: "info",
    label: "Sistema",
    desc: "Avisos importantes de la app",
  },
];

const DEFAULT_PREFS: NotificationPreferences = {
  order_status: true,
  payment: true,
  reservation: true,
  points: true,
  promotion: true,
  system: true,
};

export default function NotificationSettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { toast, showToast } = useToast();

  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<keyof NotificationPreferences | null>(
    null,
  );

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await notificationService.getPreferences();
      setPrefs(data);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = async (key: keyof NotificationPreferences) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setSaving(key);
    try {
      await notificationService.updatePreferences({ [key]: next[key] });
    } catch (e) {
      setPrefs((p) => ({ ...p, [key]: !next[key] }));
      showToast(getErrorMessage(e), "error");
    } finally {
      setSaving(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Toast
        visible={!!toast}
        message={toast?.message ?? ""}
        type={toast?.type}
      />
      <ScreenHeader title="Notificaciones" />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Feather name="alert-circle" size={40} color={colors.border} />
          <Text style={[styles.errText, { color: colors.mutedForeground }]}>
            {error}
          </Text>
          <Button title="Reintentar" onPress={load} variant="outline" />
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={[styles.intro, { color: colors.mutedForeground }]}>
            Elegí sobre qué querés recibir notificaciones.
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {ROWS.map((row, i) => (
              <View
                key={row.key}
                style={[
                  styles.row,
                  i < ROWS.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <View
                  style={[styles.rowIcon, { backgroundColor: colors.muted }]}
                >
                  <Feather
                    name={row.icon}
                    size={18}
                    color={colors.foreground}
                  />
                </View>
                <View style={styles.rowText}>
                  <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                    {row.label}
                  </Text>
                  <Text
                    style={[styles.rowDesc, { color: colors.mutedForeground }]}
                  >
                    {row.desc}
                  </Text>
                </View>
                <Switch
                  value={prefs[row.key]}
                  onValueChange={() => toggle(row.key)}
                  disabled={saving === row.key}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            ))}
          </View>
        </View>
      )}
      <View style={{ height: insets.bottom }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    padding: 24,
  },
  errText: { fontSize: 14, textAlign: "center" },
  content: { paddingHorizontal: 20, paddingTop: 16, gap: 14 },
  intro: { fontSize: 14, lineHeight: 20 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
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
  rowText: { flex: 1, gap: 2 },
  rowLabel: { fontSize: 15, fontWeight: "600" },
  rowDesc: { fontSize: 12, lineHeight: 16 },
});
