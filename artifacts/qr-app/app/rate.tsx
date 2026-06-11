import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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
import { RatingInput } from "@/components/RatingInput";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import { GuestModal } from "@/components/GuestModal";
import { useAuthStore } from "@/stores/authStore";
import { useSessionStore } from "@/stores/sessionStore";
import { orderService } from "@/services/orders";
import { ratingService } from "@/services/ratings";
import { getErrorMessage } from "@/services/api";
import { Order } from "@/types";

interface DishState {
  productId: string;
  name: string;
  rating: number;
  review: string;
}

export default function RateScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { toast, showToast } = useToast();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();

  const isGuest = useAuthStore((s) => s.isGuest);
  const session = useSessionStore((s) => s.session);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [restaurantRating, setRestaurantRating] = useState(0);
  const [dishes, setDishes] = useState<DishState[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!orderId) {
      setError("No se encontró el pedido a calificar.");
      setLoading(false);
      return;
    }
    setError(null);
    try {
      const data = await orderService.getOrder(orderId);
      setOrder(data);
      const seen = new Set<string>();
      const list: DishState[] = [];
      for (const it of data.items ?? []) {
        const pid = it.product_id ?? it.product?.id;
        if (!pid || seen.has(pid)) continue;
        seen.add(pid);
        list.push({
          productId: pid,
          name: it.product?.name ?? "Producto",
          rating: 0,
          review: "",
        });
      }
      setDishes(list);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  const setDish = (productId: string, patch: Partial<DishState>) => {
    setDishes((prev) =>
      prev.map((d) => (d.productId === productId ? { ...d, ...patch } : d)),
    );
  };

  const hasAnyRating =
    restaurantRating > 0 || dishes.some((d) => d.rating > 0);

  const submit = async () => {
    if (!hasAnyRating) {
      showToast("Calificá al menos una opción", "error");
      return;
    }
    setSubmitting(true);
    try {
      if (restaurantRating > 0 && order?.branch_id && session?.id) {
        await ratingService.rateRestaurant(
          order.branch_id,
          session.id,
          restaurantRating,
        );
      }
      for (const d of dishes) {
        if (d.rating <= 0) continue;
        const res = await ratingService.rateDish(
          d.productId,
          d.productId,
          d.rating,
        );
        if (d.review.trim() && res?.id) {
          await ratingService.writeDishReview(res.id, d.review.trim());
        }
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("¡Gracias por tu opinión!", "success");
      setTimeout(() => {
        if (router.canGoBack()) router.back();
        else router.replace("/(tabs)");
      }, 800);
    } catch (e) {
      showToast(getErrorMessage(e), "error");
      setSubmitting(false);
    }
  };

  if (isGuest) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Calificar" />
        <GuestModal
          visible
          onClose={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/(tabs)");
          }}
          message="Iniciá sesión para calificar tu experiencia"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Toast
        visible={!!toast}
        message={toast?.message ?? ""}
        type={toast?.type}
      />
      <ScreenHeader
        title="Calificar"
        subtitle={order?.restaurant?.name ?? undefined}
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
      ) : (
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
            {session?.id ? (
              <View
                style={[
                  styles.card,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                  ¿Cómo estuvo tu experiencia?
                </Text>
                <Text
                  style={[styles.cardSub, { color: colors.mutedForeground }]}
                >
                  Calificá al restaurante en general
                </Text>
                <View style={styles.starsCenter}>
                  <RatingInput
                    value={restaurantRating}
                    onChange={setRestaurantRating}
                    size={36}
                  />
                </View>
              </View>
            ) : null}

            {dishes.length > 0 ? (
              <>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Calificá tus platos
                </Text>
                {dishes.map((d) => (
                  <View
                    key={d.productId}
                    style={[
                      styles.card,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.dishName, { color: colors.foreground }]}
                      numberOfLines={2}
                    >
                      {d.name}
                    </Text>
                    <RatingInput
                      value={d.rating}
                      onChange={(v) => setDish(d.productId, { rating: v })}
                      size={28}
                    />
                    {d.rating > 0 ? (
                      <TextInput
                        value={d.review}
                        onChangeText={(t) =>
                          setDish(d.productId, { review: t })
                        }
                        placeholder="Escribí una reseña (opcional)"
                        placeholderTextColor={colors.mutedForeground}
                        multiline
                        style={[
                          styles.review,
                          {
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                            color: colors.foreground,
                          },
                        ]}
                      />
                    ) : null}
                  </View>
                ))}
              </>
            ) : null}
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
              title="Enviar calificación"
              onPress={submit}
              loading={submitting}
              disabled={!hasAnyRating}
              fullWidth
              size="lg"
            />
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    padding: 24,
  },
  errText: { fontSize: 14, textAlign: "center" },
  content: { paddingHorizontal: 20, paddingTop: 16, gap: 14 },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    gap: 12,
  },
  cardTitle: { fontSize: 17, fontWeight: "700" },
  cardSub: { fontSize: 13, marginTop: -6 },
  starsCenter: { alignItems: "center", paddingVertical: 6 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginTop: 4 },
  dishName: { fontSize: 15, fontWeight: "600" },
  review: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 70,
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
