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
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { ScreenHeader } from "@/components/ScreenHeader";
import { StarRating } from "@/components/StarRating";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import {
  FavoriteProduct,
  FavoriteRestaurant,
  profileService,
} from "@/services/profile";
import { getErrorMessage } from "@/services/api";
import { formatGs } from "@/utils/format";

type Tab = "restaurants" | "products";

export default function FavoritesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { toast, showToast } = useToast();

  const [tab, setTab] = useState<Tab>("restaurants");
  const [restaurants, setRestaurants] = useState<FavoriteRestaurant[]>([]);
  const [products, setProducts] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await profileService.getUserFavorites();
      setRestaurants(data.restaurants);
      setProducts(data.products);
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

  const unfavorite = async (id: string, kind: Tab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRemoving(id);
    const prevR = restaurants;
    const prevP = products;
    if (kind === "restaurants") {
      setRestaurants((l) => l.filter((r) => r.id !== id));
    } else {
      setProducts((l) => l.filter((p) => p.id !== id));
    }
    try {
      await profileService.removeFavorite(id);
      showToast("Eliminado de favoritos", "success");
    } catch (e) {
      setRestaurants(prevR);
      setProducts(prevP);
      showToast(getErrorMessage(e), "error");
    } finally {
      setRemoving(null);
    }
  };

  const renderEmpty = (msg: string) => (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
        <Feather name="heart" size={26} color={colors.mutedForeground} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        Sin favoritos todavía
      </Text>
      <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
        {msg}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Toast
        visible={!!toast}
        message={toast?.message ?? ""}
        type={toast?.type}
      />
      <ScreenHeader title="Mis favoritos" />

      <View style={styles.tabs}>
        {(
          [
            ["restaurants", "Restaurantes"],
            ["products", "Platos"],
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
          {tab === "restaurants" ? (
            restaurants.length === 0 ? (
              renderEmpty(
                "Guardá tus restaurantes preferidos para encontrarlos rápido.",
              )
            ) : (
              <View style={styles.list}>
                {restaurants.map((r) => (
                  <View
                    key={r.id}
                    style={[
                      styles.card,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                  >
                    <View
                      style={[
                        styles.thumb,
                        { backgroundColor: r.color ?? colors.primary },
                      ]}
                    >
                      <Text style={styles.thumbText}>
                        {r.name?.[0]?.toUpperCase() ?? "?"}
                      </Text>
                    </View>
                    <View style={styles.cardInfo}>
                      <Text
                        style={[styles.cardName, { color: colors.foreground }]}
                        numberOfLines={1}
                      >
                        {r.name}
                      </Text>
                      {r.cuisine_type ? (
                        <Text
                          style={[
                            styles.cardSub,
                            { color: colors.mutedForeground },
                          ]}
                          numberOfLines={1}
                        >
                          {r.cuisine_type}
                        </Text>
                      ) : null}
                      {r.rating != null ? (
                        <StarRating rating={r.rating} size={12} />
                      ) : null}
                    </View>
                    <Pressable
                      hitSlop={8}
                      disabled={removing === r.id}
                      onPress={() => unfavorite(r.id, "restaurants")}
                      style={styles.heartBtn}
                    >
                      <Feather
                        name="heart"
                        size={22}
                        color={colors.primary}
                        style={{ opacity: removing === r.id ? 0.4 : 1 }}
                      />
                    </Pressable>
                  </View>
                ))}
              </View>
            )
          ) : products.length === 0 ? (
            renderEmpty("Guardá los platos que más te gustan para pedirlos otra vez.")
          ) : (
            <View style={styles.list}>
              {products.map((p) => (
                <View
                  key={p.id}
                  style={[
                    styles.card,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <View
                    style={[styles.thumb, { backgroundColor: colors.muted }]}
                  >
                    <Feather
                      name="coffee"
                      size={20}
                      color={colors.mutedForeground}
                    />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text
                      style={[styles.cardName, { color: colors.foreground }]}
                      numberOfLines={1}
                    >
                      {p.name}
                    </Text>
                    {p.restaurant_name ? (
                      <Text
                        style={[
                          styles.cardSub,
                          { color: colors.mutedForeground },
                        ]}
                        numberOfLines={1}
                      >
                        {p.restaurant_name}
                      </Text>
                    ) : null}
                    <Text style={[styles.cardPrice, { color: colors.primary }]}>
                      {formatGs(p.price)}
                    </Text>
                  </View>
                  <Pressable
                    hitSlop={8}
                    disabled={removing === p.id}
                    onPress={() => unfavorite(p.id, "products")}
                    style={styles.heartBtn}
                  >
                    <Feather
                      name="heart"
                      size={22}
                      color={colors.primary}
                      style={{ opacity: removing === p.id ? 0.4 : 1 }}
                    />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 20,
  },
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
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbText: { color: "#FFFFFF", fontSize: 22, fontWeight: "700" },
  cardInfo: { flex: 1, gap: 3 },
  cardName: { fontSize: 15, fontWeight: "600" },
  cardSub: { fontSize: 13 },
  cardPrice: { fontSize: 14, fontWeight: "700" },
  heartBtn: { padding: 4 },
  empty: {
    alignItems: "center",
    paddingTop: 80,
    gap: 10,
  },
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
});
