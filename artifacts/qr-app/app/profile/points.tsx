import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Button } from "@/components/ui/Button";
import {
  PointsBalance,
  PointsEntryType,
  PointsHistoryEntry,
  pointsService,
} from "@/services/points";
import { getErrorMessage } from "@/services/api";
import { formatDateLabel } from "@/utils/format";

type Filter = "all" | "earned" | "redeemed";

const EARN_WAYS: { icon: keyof typeof Feather.glyphMap; label: string; pts: string }[] = [
  { icon: "user-check", label: "Completar tu perfil", pts: "+100 pts" },
  { icon: "shopping-bag", label: "Pedir comida", pts: "+50 pts" },
  { icon: "star", label: "Calificar un restaurante", pts: "+20 pts" },
  { icon: "edit-3", label: "Escribir una reseña", pts: "+30 pts" },
];

const LEVEL_META: Record<string, { label: string; color: string }> = {
  bronce: { label: "Bronce", color: "#CD7F32" },
  plata: { label: "Plata", color: "#9CA3AF" },
  oro: { label: "Oro", color: "#F59E0B" },
};

export default function PointsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [balance, setBalance] = useState<PointsBalance | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [entries, setEntries] = useState<PointsHistoryEntry[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filterToType = (f: Filter): PointsEntryType | undefined =>
    f === "earned" ? "earned" : f === "redeemed" ? "redeemed" : undefined;

  const loadAll = useCallback(async (f: Filter) => {
    setLoading(true);
    setError(null);
    try {
      const [bal, hist] = await Promise.all([
        pointsService.getBalance(),
        pointsService.getHistory(1, filterToType(f)),
      ]);
      setBalance(bal);
      setEntries(hist.entries);
      setHasMore(hist.has_more);
      setPage(1);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll(filter);
  }, [filter, loadAll]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const next = page + 1;
      const hist = await pointsService.getHistory(next, filterToType(filter));
      setEntries((prev) => [...prev, ...hist.entries]);
      setHasMore(hist.has_more);
      setPage(next);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const onScroll = ({ nativeEvent }: { nativeEvent: any }) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    if (
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - 200
    ) {
      loadMore();
    }
  };

  const level = balance
    ? LEVEL_META[balance.level?.toLowerCase()] ?? {
        label: balance.level,
        color: "#CD7F32",
      }
    : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Puntos y recompensas" />

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
          <Button
            title="Reintentar"
            onPress={() => loadAll(filter)}
            variant="outline"
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={200}
        >
          <View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
            <Text style={styles.balanceLabel}>Tu saldo</Text>
            <Text style={styles.balanceValue}>{balance?.balance ?? 0}</Text>
            <Text style={styles.balanceUnit}>puntos</Text>
            {level ? (
              <View style={styles.levelBadge}>
                <Feather name="award" size={14} color={level.color} />
                <Text style={[styles.levelText, { color: level.color }]}>
                  Nivel {level.label}
                </Text>
              </View>
            ) : null}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            ¿Cómo ganar puntos?
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {EARN_WAYS.map((w, i) => (
              <View
                key={w.label}
                style={[
                  styles.earnRow,
                  i < EARN_WAYS.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.earnIcon,
                    { backgroundColor: colors.primary + "15" },
                  ]}
                >
                  <Feather name={w.icon} size={18} color={colors.primary} />
                </View>
                <Text style={[styles.earnLabel, { color: colors.foreground }]}>
                  {w.label}
                </Text>
                <Text style={[styles.earnPts, { color: colors.success }]}>
                  {w.pts}
                </Text>
              </View>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Historial
          </Text>
          <View style={styles.filters}>
            {(
              [
                ["all", "Todos"],
                ["earned", "Ganados"],
                ["redeemed", "Canjeados"],
              ] as [Filter, string][]
            ).map(([key, label]) => {
              const active = filter === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => setFilter(key)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: active ? colors.primary : colors.muted,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      { color: active ? "#FFFFFF" : colors.mutedForeground },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {entries.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Feather name="inbox" size={32} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Todavía no hay movimientos
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              {entries.map((e, i) => {
                const earned = e.type === "earned" || e.amount >= 0;
                return (
                  <View
                    key={e.id}
                    style={[
                      styles.histRow,
                      i < entries.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.histIcon,
                        {
                          backgroundColor: earned
                            ? colors.success + "15"
                            : colors.destructive + "15",
                        },
                      ]}
                    >
                      <Feather
                        name={earned ? "arrow-down-left" : "arrow-up-right"}
                        size={16}
                        color={earned ? colors.success : colors.destructive}
                      />
                    </View>
                    <View style={styles.histInfo}>
                      <Text
                        style={[styles.histReason, { color: colors.foreground }]}
                        numberOfLines={1}
                      >
                        {e.reason}
                      </Text>
                      <Text
                        style={[
                          styles.histMeta,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {formatDateLabel(e.created_at)}
                        {e.reference ? ` · ${e.reference}` : ""}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.histAmount,
                        { color: earned ? colors.success : colors.destructive },
                      ]}
                    >
                      {earned ? "+" : "-"}
                      {Math.abs(e.amount)} pts
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {loadingMore ? (
            <ActivityIndicator
              color={colors.primary}
              style={{ marginTop: 16 }}
            />
          ) : null}
        </ScrollView>
      )}
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
  balanceCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 2,
  },
  balanceLabel: { color: "rgba(255,255,255,0.85)", fontSize: 14 },
  balanceValue: {
    color: "#FFFFFF",
    fontSize: 48,
    fontWeight: "800",
    letterSpacing: -1,
  },
  balanceUnit: { color: "rgba(255,255,255,0.85)", fontSize: 15 },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 12,
  },
  levelText: { fontSize: 13, fontWeight: "700" },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 6,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  earnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
  },
  earnIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  earnLabel: { flex: 1, fontSize: 14, fontWeight: "500" },
  earnPts: { fontSize: 14, fontWeight: "700" },
  filters: { flexDirection: "row", gap: 8 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  filterText: { fontSize: 13, fontWeight: "600" },
  emptyHistory: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: { fontSize: 14 },
  histRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  histIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  histInfo: { flex: 1, gap: 2 },
  histReason: { fontSize: 14, fontWeight: "600" },
  histMeta: { fontSize: 12 },
  histAmount: { fontSize: 15, fontWeight: "700" },
});
