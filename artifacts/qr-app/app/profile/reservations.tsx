import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import {
  Reservation,
  ReservationStatus,
  reservationService,
} from "@/services/reservations";
import { getErrorMessage } from "@/services/api";

type Tab = "upcoming" | "past";

const STATUS_META: Record<
  ReservationStatus,
  { label: string; color: string }
> = {
  pending: { label: "Pendiente", color: "#F59E0B" },
  confirmed: { label: "Confirmada", color: "#00B894" },
  cancelled: { label: "Cancelada", color: "#FF7675" },
  rejected: { label: "Rechazada", color: "#FF7675" },
  completed: { label: "Completada", color: "#636E72" },
};

function statusMeta(status: string) {
  return (
    STATUS_META[status as ReservationStatus] ?? {
      label: status,
      color: "#636E72",
    }
  );
}

export default function ReservationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { toast, showToast } = useToast();

  const [tab, setTab] = useState<Tab>("upcoming");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await reservationService.getMyReservations();
      setReservations(data);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const isUpcoming = (r: Reservation) =>
    r.status === "pending" || r.status === "confirmed";

  const filtered = reservations.filter((r) =>
    tab === "upcoming" ? isUpcoming(r) : !isUpcoming(r),
  );

  const cancel = (r: Reservation) => {
    Alert.alert(
      "Cancelar reserva",
      "¿Seguro que querés cancelar esta reserva?",
      [
        { text: "Volver", style: "cancel" },
        {
          text: "Cancelar reserva",
          style: "destructive",
          onPress: async () => {
            setCancelling(r.id);
            try {
              await reservationService.cancelReservation(r.id);
              await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
              setReservations((prev) =>
                prev.map((x) =>
                  x.id === r.id ? { ...x, status: "cancelled" } : x,
                ),
              );
              setSelected(null);
              showToast("Reserva cancelada", "success");
            } catch (e) {
              showToast(getErrorMessage(e), "error");
            } finally {
              setCancelling(null);
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
      <ScreenHeader title="Reservas" />

      <View style={styles.newWrap}>
        <Button
          title="Nueva reserva"
          onPress={() => router.push("/reservations/new")}
          fullWidth
        />
      </View>

      <View style={styles.tabs}>
        {(
          [
            ["upcoming", "Próximas"],
            ["past", "Pasadas"],
          ] as [Tab, string][]
        ).map(([key, label]) => {
          const active = tab === key;
          return (
            <Pressable
              key={key}
              style={[
                styles.tab,
                { borderBottomColor: active ? colors.primary : "transparent" },
              ]}
              onPress={() => setTab(key)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: active ? colors.primary : colors.mutedForeground },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

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
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
                <Feather name="calendar" size={26} color={colors.mutedForeground} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {tab === "upcoming"
                  ? "No tenés reservas próximas"
                  : "No tenés reservas pasadas"}
              </Text>
              <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
                {tab === "upcoming"
                  ? "Reservá tu mesa con anticipación tocando “Nueva reserva”."
                  : "Acá vas a ver el historial de tus reservas."}
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {filtered.map((r) => {
                const meta = statusMeta(r.status);
                return (
                  <Pressable
                    key={r.id}
                    style={({ pressed }) => [
                      styles.card,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                    onPress={() => setSelected(r)}
                  >
                    <View style={styles.cardHeader}>
                      <Text
                        style={[styles.cardName, { color: colors.foreground }]}
                        numberOfLines={1}
                      >
                        {r.restaurant_name ?? "Restaurante"}
                      </Text>
                      <View
                        style={[
                          styles.badge,
                          { backgroundColor: meta.color + "1A" },
                        ]}
                      >
                        <Text style={[styles.badgeText, { color: meta.color }]}>
                          {meta.label}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.metaRow}>
                      <Feather name="calendar" size={14} color={colors.mutedForeground} />
                      <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                        {r.date}
                      </Text>
                      <Feather name="clock" size={14} color={colors.mutedForeground} />
                      <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                        {r.time}
                      </Text>
                      <Feather name="users" size={14} color={colors.mutedForeground} />
                      <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                        {r.party_size}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setSelected(null)}>
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
              <View style={[styles.handleBar, { backgroundColor: colors.border }]} />
            </View>
            {selected ? (
              <>
                <View style={styles.sheetHeader}>
                  <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
                    {selected.restaurant_name ?? "Reserva"}
                  </Text>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: statusMeta(selected.status).color + "1A" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        { color: statusMeta(selected.status).color },
                      ]}
                    >
                      {statusMeta(selected.status).label}
                    </Text>
                  </View>
                </View>
                <DetailRow icon="calendar" label="Fecha" value={selected.date} />
                <DetailRow icon="clock" label="Horario" value={selected.time} />
                <DetailRow
                  icon="users"
                  label="Personas"
                  value={String(selected.party_size)}
                />
                {selected.special_requests ? (
                  <DetailRow
                    icon="message-square"
                    label="Pedidos especiales"
                    value={selected.special_requests}
                  />
                ) : null}
                {isUpcoming(selected) ? (
                  <Button
                    title="Cancelar reserva"
                    variant="destructive"
                    fullWidth
                    loading={cancelling === selected.id}
                    onPress={() => cancel(selected)}
                    style={{ marginTop: 16 }}
                  />
                ) : null}
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.detailRow}>
      <Feather name={icon} size={18} color={colors.mutedForeground} />
      <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <Text
        style={[styles.detailValue, { color: colors.foreground }]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  newWrap: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  tabs: { flexDirection: "row", paddingHorizontal: 20 },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 2,
  },
  tabText: { fontSize: 15, fontWeight: "600" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    padding: 24,
  },
  errText: { fontSize: 14, textAlign: "center" },
  content: { paddingHorizontal: 20, paddingTop: 16 },
  list: { gap: 12 },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  cardName: { fontSize: 16, fontWeight: "700", flex: 1 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: { fontSize: 12, fontWeight: "700" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 13, marginRight: 8 },
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptyDesc: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 24,
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
  },
  sheetHandle: { alignItems: "center", paddingVertical: 10 },
  handleBar: { width: 40, height: 4, borderRadius: 2 },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 10,
  },
  sheetTitle: { fontSize: 18, fontWeight: "700", flex: 1 },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  detailLabel: { fontSize: 14, width: 96 },
  detailValue: { fontSize: 14, fontWeight: "600", flex: 1 },
});
