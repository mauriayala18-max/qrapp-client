import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import { useAuthStore } from "@/stores/authStore";
import { useSessionStore } from "@/stores/sessionStore";
import { reservationService } from "@/services/reservations";
import { getErrorMessage } from "@/services/api";

const WEEKDAYS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS_ES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

const TIMES = [
  "12:00", "12:30", "13:00", "13:30", "14:00",
  "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00",
];

const PARTY_SIZES = [1, 2, 3, 4, 5, 6, 7, 8];

function buildDays(count: number) {
  const days: { iso: string; weekday: string; day: number; month: string }[] =
    [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    days.push({
      iso,
      weekday: i === 0 ? "Hoy" : WEEKDAYS_ES[d.getDay()],
      day: d.getDate(),
      month: MONTHS_ES[d.getMonth()],
    });
  }
  return days;
}

export default function NewReservationScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { toast, showToast } = useToast();

  const session = useSessionStore((s) => s.session);
  const params = useLocalSearchParams<{
    branchId?: string;
    restaurantId?: string;
    restaurantName?: string;
  }>();

  // Prefer an active session; otherwise fall back to params from a
  // restaurant profile so the reservation pre-selects that restaurant.
  const branchId = session?.branch?.id ?? params.branchId ?? undefined;
  const restaurant =
    session?.restaurant ??
    (params.restaurantName || params.restaurantId
      ? { id: params.restaurantId ?? "", name: params.restaurantName ?? "Restaurante" }
      : undefined);

  const days = useMemo(() => buildDays(14), []);
  const [date, setDate] = useState<string>(days[0]?.iso ?? "");
  const [time, setTime] = useState<string>("");
  const [partySize, setPartySize] = useState<number>(2);
  const [requests, setRequests] = useState("");
  const [saving, setSaving] = useState(false);

  const canSubmit = !!restaurant && !!date && !!time && partySize > 0;

  const submit = async () => {
    if (!restaurant || !branchId) {
      showToast("Escaneá el QR de un restaurante para reservar", "error");
      return;
    }
    if (!canSubmit) {
      showToast("Elegí fecha y horario", "error");
      return;
    }
    setSaving(true);
    try {
      await reservationService.createReservation({
        restaurant_id: restaurant?.id,
        branch_id: branchId,
        restaurant_name: restaurant?.name,
        date,
        time,
        party_size: partySize,
        special_requests: requests.trim() || undefined,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("¡Reserva creada!", "success");
      setTimeout(() => {
        if (router.canGoBack()) router.back();
        else router.replace("/profile/reservations");
      }, 700);
    } catch (e) {
      showToast(getErrorMessage(e), "error");
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Toast
        visible={!!toast}
        message={toast?.message ?? ""}
        type={toast?.type}
      />
      <ScreenHeader
        title="Nueva reserva"
        subtitle={restaurant?.name ?? undefined}
      />
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
          {!restaurant ? (
            <View
              style={[
                styles.notice,
                { backgroundColor: colors.primary + "12" },
              ]}
            >
              <Feather name="info" size={16} color={colors.primary} />
              <Text style={[styles.noticeText, { color: colors.foreground }]}>
                Escaneá el QR de un restaurante para reservar en ese local.
              </Text>
            </View>
          ) : null}

          <Text style={[styles.label, { color: colors.foreground }]}>Fecha</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dayRow}
          >
            {days.map((d) => {
              const active = d.iso === date;
              return (
                <Pressable
                  key={d.iso}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setDate(d.iso);
                  }}
                  style={[
                    styles.dayChip,
                    {
                      backgroundColor: active ? colors.primary : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayWeekday,
                      { color: active ? "rgba(255,255,255,0.85)" : colors.mutedForeground },
                    ]}
                  >
                    {d.weekday}
                  </Text>
                  <Text
                    style={[
                      styles.dayNum,
                      { color: active ? "#FFFFFF" : colors.foreground },
                    ]}
                  >
                    {d.day}
                  </Text>
                  <Text
                    style={[
                      styles.dayMonth,
                      { color: active ? "rgba(255,255,255,0.85)" : colors.mutedForeground },
                    ]}
                  >
                    {d.month}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={[styles.label, { color: colors.foreground }]}>
            Horario
          </Text>
          <View style={styles.grid}>
            {TIMES.map((t) => {
              const active = t === time;
              return (
                <Pressable
                  key={t}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setTime(t);
                  }}
                  style={[
                    styles.timeChip,
                    {
                      backgroundColor: active ? colors.primary : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.timeText,
                      { color: active ? "#FFFFFF" : colors.foreground },
                    ]}
                  >
                    {t}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.label, { color: colors.foreground }]}>
            Cantidad de personas
          </Text>
          <View style={styles.grid}>
            {PARTY_SIZES.map((n) => {
              const active = n === partySize;
              return (
                <Pressable
                  key={n}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setPartySize(n);
                  }}
                  style={[
                    styles.sizeChip,
                    {
                      backgroundColor: active ? colors.primary : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.timeText,
                      { color: active ? "#FFFFFF" : colors.foreground },
                    ]}
                  >
                    {n === 8 ? "8+" : n}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.label, { color: colors.foreground }]}>
            Pedidos especiales (opcional)
          </Text>
          <TextInput
            value={requests}
            onChangeText={setRequests}
            placeholder="Ej: mesa junto a la ventana, silla para bebé…"
            placeholderTextColor={colors.mutedForeground}
            multiline
            style={[
              styles.textarea,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
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
            title="Confirmar reserva"
            onPress={submit}
            loading={saving}
            disabled={!canSubmit}
            fullWidth
            size="lg"
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, gap: 12 },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
  },
  noticeText: { flex: 1, fontSize: 13, lineHeight: 18 },
  label: { fontSize: 15, fontWeight: "700", marginTop: 8 },
  dayRow: { gap: 10, paddingVertical: 2 },
  dayChip: {
    width: 64,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    gap: 2,
  },
  dayWeekday: { fontSize: 12, fontWeight: "600" },
  dayNum: { fontSize: 20, fontWeight: "800" },
  dayMonth: { fontSize: 11 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  timeChip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  timeText: { fontSize: 15, fontWeight: "600" },
  sizeChip: {
    width: 56,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 90,
    textAlignVertical: "top",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
});
