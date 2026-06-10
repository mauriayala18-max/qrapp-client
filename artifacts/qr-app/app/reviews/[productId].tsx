import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { menuService } from "@/services/menu";
import { getErrorMessage } from "@/services/api";
import { StarRating } from "@/components/StarRating";
import { Skeleton } from "@/components/Skeleton";
import { ProductReview } from "@/types";

export default function ReviewsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { productId } = useLocalSearchParams<{ productId: string }>();

  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (nextPage: number) => {
    if (!productId) return;
    try {
      const data = await menuService.getProductReviews(productId, nextPage);
      setReviews((prev) =>
        nextPage === 1 ? data.reviews : [...prev, ...data.reviews],
      );
      setTotalPages(data.total_pages ?? 1);
      setPage(nextPage);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load(1);
  }, [productId]);

  const loadMore = () => {
    if (loadingMore || loading || page >= totalPages) return;
    setLoadingMore(true);
    load(page + 1);
  };

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  };

  const renderReview = ({ item }: { item: ProductReview }) => (
    <View style={[styles.reviewCard, { borderBottomColor: colors.border }]}>
      <View style={styles.reviewHeader}>
        <View style={[styles.avatar, { backgroundColor: colors.primary + "22" }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {(item.user_name?.[0] ?? "?").toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.reviewName, { color: colors.foreground }]}>
            {item.user_name}
          </Text>
          <StarRating rating={item.rating} size={12} showNumber={false} />
        </View>
      </View>
      {item.comment ? (
        <Text style={[styles.reviewComment, { color: colors.mutedForeground }]}>
          {item.comment}
        </Text>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 12, borderBottomColor: colors.border },
        ]}
      >
        <Pressable onPress={goBack} hitSlop={10} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Reseñas</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <Skeleton width={40} height={40} radius={20} />
              <View style={{ flex: 1, gap: 8 }}>
                <Skeleton width="40%" height={14} />
                <Skeleton width="90%" height={12} />
              </View>
            </View>
          ))}
        </View>
      ) : error && reviews.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="alert-circle" size={44} color={colors.border} />
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
            {error}
          </Text>
        </View>
      ) : reviews.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="message-square" size={44} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Sin reseñas todavía
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
            Sé el primero en dejar tu opinión
          </Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          renderItem={renderReview}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                color={colors.primary}
                style={{ paddingVertical: 20 }}
              />
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  title: { fontSize: 17, fontWeight: "700" },
  loadingWrap: { padding: 16, gap: 20 },
  skeletonCard: { flexDirection: "row", gap: 12, alignItems: "center" },
  reviewCard: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 10,
  },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 15, fontWeight: "700" },
  reviewName: { fontSize: 15, fontWeight: "600", marginBottom: 2 },
  reviewComment: { fontSize: 14, lineHeight: 20 },
  empty: { alignItems: "center", paddingTop: 80, gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 17, fontWeight: "700" },
  emptyDesc: { fontSize: 14, textAlign: "center" },
});
