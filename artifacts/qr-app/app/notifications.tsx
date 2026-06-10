import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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
  AppNotification,
  notificationService,
} from "@/services/notifications";
import { getErrorMessage } from "@/services/api";
import { formatTimeAgo } from "@/utils/format";

const TYPE_ICON: Record<string, keyof typeof Feather.glyphMap> = {
  order_status: "shopping-bag",
  payment: "credit-card",
  reservation: "calendar",
  points: "award",
  promotion: "tag",
  system: "info",
};

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { toast, showToast } = useToast();

  const [items, setItems] = useState<AppNotification[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await notificationService.getNotifications(1);
      setItems(data.notifications);
      setHasMore(data.has_more);
      setPage(1);
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

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const next = page + 1;
      const data = await notificationService.getNotifications(next);
      setItems((prev) => [...prev, ...data.notifications]);
      setHasMore(data.has_more);
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

  const unreadCount = items.filter((n) => !n.read).length;

  const markAll = async () => {
    if (unreadCount === 0) return;
    setMarkingAll(true);
    const prev = items;
    setItems((list) => list.map((n) => ({ ...n, read: true })));
    try {
      await notificationService.markAllRead();
      Haptics.selectionAsync();
    } catch (e) {
      setItems(prev);
      showToast(getErrorMessage(e), "error");
    } finally {
      setMarkingAll(false);
    }
  };

  const openNotification = async (n: AppNotification) => {
    if (!n.read) {
      setItems((list) =>
        list.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
      );
      notificationService.markAsRead(n.id).catch(() => {});
    }
    switch (n.type) {
      case "order_status":
      case "payment":
        if (n.reference_id) router.push(`/order/${n.reference_id}`);
        break;
      case "reservation":
        router.push("/profile/reservations");
        break;
      case "points":
        router.push("/profile/points");
        break;
      default:
        break;
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
        title="Notificaciones"
        right={
          unreadCount > 0 ? (
            <Pressable onPress={markAll} disabled={markingAll} hitSlop={8}>
              <Text style={[styles.markAll, { color: colors.primary }]}>
                Marcar todo
              </Text>
            </Pressable>
          ) : null
        }
      />

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
      ) : items.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyWrap}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
            <Feather name="bell" size={28} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            No tenés notificaciones
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
            Acá vas a ver avisos sobre tus pedidos, reservas y puntos.
          </Text>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={200}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {items.map((n) => {
            const icon = TYPE_ICON[n.type] ?? "bell";
            return (
              <Pressable
                key={n.id}
                onPress={() => openNotification(n)}
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: n.read ? colors.background : colors.card,
                    borderColor: colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.rowIcon,
                    { backgroundColor: colors.primary + "15" },
                  ]}
                >
                  <Feather name={icon} size={18} color={colors.primary} />
                </View>
                <View style={styles.rowText}>
                  <Text
                    style={[
                      styles.rowTitle,
                      {
                        color: colors.foreground,
                        fontWeight: n.read ? "600" : "700",
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {n.title}
                  </Text>
                  <Text
                    style={[styles.rowBody, { color: colors.mutedForeground }]}
                    numberOfLines={2}
                  >
                    {n.body}
                  </Text>
                  <Text style={[styles.rowTime, { color: colors.mutedForeground }]}>
                    {formatTimeAgo(n.created_at)}
                  </Text>
                </View>
                {!n.read ? (
                  <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                ) : null}
              </Pressable>
            );
          })}
          {loadingMore ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  markAll: { fontSize: 14, fontWeight: "600" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    padding: 24,
  },
  errText: { fontSize: 14, textAlign: "center" },
  content: { paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1, gap: 3 },
  rowTitle: { fontSize: 15 },
  rowBody: { fontSize: 13, lineHeight: 18 },
  rowTime: { fontSize: 12, marginTop: 2 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  emptyWrap: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 10,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700" },
  emptyDesc: { fontSize: 14, textAlign: "center", lineHeight: 20 },
});
