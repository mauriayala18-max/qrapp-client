import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/Button";
import { GuestModal } from "@/components/GuestModal";
import { Toast } from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import { menuService } from "@/services/menu";
import { restaurantService } from "@/services/restaurants";
import { getErrorMessage } from "@/services/api";
import {
  BankingBenefit,
  BranchProfile,
  BranchReview,
  Menu,
  MenuProduct,
  RestaurantPromotion,
} from "@/types";

function Stars({ rating, colors }: { rating: number; colors: ReturnType<typeof useColors> }) {
  const full = Math.floor(rating);
  return (
    <View style={{ flexDirection: "row" }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Feather
          key={i}
          name="star"
          size={14}
          color={i < full ? "#FDCB6E" : colors.border}
        />
      ))}
    </View>
  );
}

export default function RestaurantProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { branchId } = useLocalSearchParams<{ branchId: string }>();
  const isGuest = useAuthStore((s) => s.isGuest);
  const { toast, showToast } = useToast();

  const [profile, setProfile] = useState<BranchProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [featured, setFeatured] = useState<MenuProduct[]>([]);
  const [promotions, setPromotions] = useState<RestaurantPromotion[]>([]);
  const [benefits, setBenefits] = useState<BankingBenefit[]>([]);
  const [reviews, setReviews] = useState<BranchReview[]>([]);
  const [guestModal, setGuestModal] = useState(false);

  const [menu, setMenu] = useState<Menu | null>(null);
  const [menuLoading, setMenuLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const load = useCallback(async () => {
    if (!branchId) return;
    setError(null);
    try {
      const data = await restaurantService.getBranchProfile(branchId);
      setProfile(data);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
    // Secondary data loads independently; failures degrade gracefully.
    menuService.getFeatured(branchId).then(setFeatured).catch(() => setFeatured([]));
    restaurantService
      .getBranchPromotions(branchId)
      .then(setPromotions)
      .catch(() => setPromotions([]));
    restaurantService
      .getBankingBenefits(branchId)
      .then(setBenefits)
      .catch(() => setBenefits([]));
    restaurantService.getReviews(branchId).then(setReviews).catch(() => setReviews([]));
  }, [branchId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleReserve = () => {
    if (isGuest) {
      setGuestModal(true);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/reservations/new",
      params: {
        branchId: branchId ?? "",
        restaurantId: profile?.restaurant_id ?? "",
        restaurantName: profile?.name ?? "",
      },
    });
  };

  const handleDirections = () => {
    if (!profile) return;
    const query =
      profile.latitude != null && profile.longitude != null
        ? `${profile.latitude},${profile.longitude}`
        : encodeURIComponent(profile.address ?? profile.name);
    const url =
      Platform.OS === "ios"
        ? `http://maps.apple.com/?q=${query}`
        : `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(url).catch(() =>
      showToast("No pudimos abrir el mapa", "error"),
    );
  };

  const handleCall = () => {
    if (!profile?.phone) return;
    Linking.openURL(`tel:${profile.phone}`).catch(() =>
      showToast("No pudimos iniciar la llamada", "error"),
    );
  };

  const handleViewMenu = async () => {
    if (!branchId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !showMenu;
    setShowMenu(next);
    if (next && !menu && !menuLoading) {
      setMenuLoading(true);
      try {
        const data = await menuService.getMenu(branchId);
        setMenu(data);
      } catch (e) {
        showToast(getErrorMessage(e), "error");
        setShowMenu(false);
      } finally {
        setMenuLoading(false);
      }
    }
  };

  const paddingBottom = insets.bottom + 40;

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
            <Feather name="chevron-left" size={26} color={colors.foreground} />
          </Pressable>
        </View>
        <View style={[styles.center, { flex: 1, gap: 14, padding: 24 }]}>
          <Feather name="alert-circle" size={40} color={colors.border} />
          <Text style={[styles.errText, { color: colors.mutedForeground }]}>
            {error ?? "No encontramos este restaurante"}
          </Text>
          <Button title="Reintentar" onPress={load} variant="outline" />
        </View>
      </View>
    );
  }

  const heroColor = profile.color ?? colors.primary;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Toast visible={!!toast} message={toast?.message ?? ""} type={toast?.type} />
      <ScrollView
        contentContainerStyle={{ paddingBottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: heroColor }]}>
          <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              style={[styles.backBtn, styles.heroBtn]}
            >
              <Feather name="chevron-left" size={24} color="#FFFFFF" />
            </Pressable>
          </View>
          <View style={styles.heroIcon}>
            <Feather name="coffee" size={40} color="rgba(255,255,255,0.95)" />
          </View>
        </View>

        <View style={styles.body}>
          <Text style={[styles.name, { color: colors.foreground }]}>
            {profile.name}
          </Text>
          <View style={styles.metaRow}>
            {profile.rating != null ? (
              <>
                <Stars rating={profile.rating} colors={colors} />
                <Text style={[styles.ratingText, { color: colors.foreground }]}>
                  {profile.rating.toFixed(1)}
                </Text>
              </>
            ) : null}
            {profile.reviews_count != null ? (
              <Text style={[styles.metaMuted, { color: colors.mutedForeground }]}>
                ({profile.reviews_count} reseñas)
              </Text>
            ) : null}
            {profile.cuisine_type ? (
              <Text style={[styles.metaMuted, { color: colors.mutedForeground }]}>
                · {profile.cuisine_type}
              </Text>
            ) : null}
          </View>

          {profile.description ? (
            <Text style={[styles.description, { color: colors.mutedForeground }]}>
              {profile.description}
            </Text>
          ) : null}

          {/* Primary actions */}
          <View style={styles.actionsRow}>
            <Button
              title={showMenu ? "Ocultar menú" : "Ver menú"}
              onPress={handleViewMenu}
              loading={menuLoading}
              variant="outline"
              style={styles.actionFlex}
            />
            <Button
              title="Reservar"
              onPress={handleReserve}
              style={styles.actionFlex}
            />
          </View>
          <View style={styles.secondaryRow}>
            <SecondaryAction
              icon="map-pin"
              label="Cómo llegar"
              onPress={handleDirections}
              colors={colors}
            />
            {profile.phone ? (
              <SecondaryAction
                icon="phone"
                label="Llamar"
                onPress={handleCall}
                colors={colors}
              />
            ) : null}
          </View>

          {/* Info */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {profile.address ? (
              <InfoRow icon="map-pin" text={profile.address} colors={colors} />
            ) : null}
            {profile.phone ? (
              <InfoRow icon="phone" text={profile.phone} colors={colors} />
            ) : null}
            {profile.hours && profile.hours.length > 0 ? (
              <View style={styles.hoursWrap}>
                <View style={styles.hoursHeader}>
                  <Feather name="clock" size={16} color={colors.mutedForeground} />
                  <Text style={[styles.hoursTitle, { color: colors.foreground }]}>
                    Horarios
                  </Text>
                </View>
                {profile.hours.map((h, i) => (
                  <View key={i} style={styles.hoursRow}>
                    <Text style={[styles.hoursDay, { color: colors.mutedForeground }]}>
                      {h.day}
                    </Text>
                    <Text style={[styles.hoursTime, { color: colors.foreground }]}>
                      {h.closed
                        ? "Cerrado"
                        : h.open && h.close
                          ? `${h.open} - ${h.close}`
                          : "—"}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
            {!profile.address && !profile.phone && !(profile.hours && profile.hours.length) ? (
              <Text style={[styles.emptyInline, { color: colors.mutedForeground }]}>
                Información de contacto no disponible
              </Text>
            ) : null}
          </View>

          {/* Points */}
          <View style={[styles.pointsCard, { backgroundColor: colors.primary + "12" }]}>
            <View style={[styles.pointsIcon, { backgroundColor: colors.primary }]}>
              <Feather name="award" size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.pointsTitle, { color: colors.foreground }]}>
                Ganá puntos en cada visita
              </Text>
              <Text style={[styles.pointsDesc, { color: colors.mutedForeground }]}>
                Acumulá puntos al pedir y canjéalos por recompensas.
              </Text>
            </View>
          </View>

          {/* Featured menu */}
          {featured.length > 0 ? (
            <Section title="Menú destacado">
              {featured.slice(0, 5).map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => router.push(`/product/${p.id}`)}
                  style={({ pressed }) => [
                    styles.dishRow,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <View style={[styles.dishImg, { backgroundColor: colors.muted }]}>
                    <Feather name="shopping-bag" size={20} color={colors.mutedForeground} />
                  </View>
                  <Text style={[styles.dishName, { color: colors.foreground }]} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text style={[styles.dishPrice, { color: colors.primary }]}>
                    Gs {p.price.toLocaleString("es-PY")}
                  </Text>
                </Pressable>
              ))}
            </Section>
          ) : null}

          {/* Full menu (read-only) */}
          {showMenu ? (
            menuLoading ? (
              <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : menu && menu.products.length > 0 ? (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Menú
                </Text>
                {(menu.categories.length > 0
                  ? menu.categories
                  : [{ id: "all", name: "" }]
                ).map((cat) => {
                  const items = menu.products.filter((p) =>
                    cat.id === "all" ? true : p.category_id === cat.id,
                  );
                  if (items.length === 0) return null;
                  return (
                    <View key={cat.id} style={{ gap: 10, marginBottom: 16 }}>
                      {cat.name ? (
                        <Text style={[styles.menuCategory, { color: colors.mutedForeground }]}>
                          {cat.name}
                        </Text>
                      ) : null}
                      {items.map((p) => (
                        <Pressable
                          key={p.id}
                          onPress={() => router.push(`/product/${p.id}`)}
                          style={({ pressed }) => [
                            styles.dishRow,
                            {
                              backgroundColor: colors.card,
                              borderColor: colors.border,
                              opacity: pressed ? 0.85 : 1,
                            },
                          ]}
                        >
                          <View style={[styles.dishImg, { backgroundColor: colors.muted }]}>
                            <Feather name="shopping-bag" size={20} color={colors.mutedForeground} />
                          </View>
                          <Text
                            style={[styles.dishName, { color: colors.foreground }]}
                            numberOfLines={1}
                          >
                            {p.name}
                          </Text>
                          <Text style={[styles.dishPrice, { color: colors.primary }]}>
                            Gs {p.price.toLocaleString("es-PY")}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={[styles.emptyInline, { color: colors.mutedForeground, marginTop: 8 }]}>
                Este restaurante todavía no tiene un menú disponible.
              </Text>
            )
          ) : null}

          {/* Promotions */}
          {promotions.length > 0 ? (
            <Section title="Promociones">
              {promotions.map((promo) => (
                <View
                  key={promo.id}
                  style={[styles.promoRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={[styles.promoTag, { backgroundColor: colors.primary + "1A" }]}>
                    <Text style={[styles.promoTagText, { color: colors.primary }]}>
                      {promo.discount ?? "Promo"}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.promoTitle, { color: colors.foreground }]}>
                      {promo.title}
                    </Text>
                    {promo.description ? (
                      <Text style={[styles.promoDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                        {promo.description}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </Section>
          ) : null}

          {/* Banking benefits */}
          {benefits.length > 0 ? (
            <Section title="Beneficios bancarios">
              {benefits.map((b) => (
                <View
                  key={b.id}
                  style={[styles.benefitRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <Feather name="credit-card" size={18} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.benefitName, { color: colors.foreground }]}>
                      {b.bank_name}
                      {b.card_label ? ` · ${b.card_label}` : ""}
                    </Text>
                    {b.description ? (
                      <Text style={[styles.benefitDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                        {b.description}
                      </Text>
                    ) : null}
                  </View>
                  {b.discount_percentage != null ? (
                    <Text style={[styles.benefitDiscount, { color: colors.success }]}>
                      {b.discount_percentage}%
                    </Text>
                  ) : null}
                </View>
              ))}
            </Section>
          ) : null}

          {/* Reviews */}
          {reviews.length > 0 ? (
            <Section title="Reseñas">
              {reviews.slice(0, 5).map((r) => (
                <View
                  key={r.id}
                  style={[styles.reviewRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={styles.reviewHeader}>
                    <Text style={[styles.reviewName, { color: colors.foreground }]}>
                      {r.user_name}
                    </Text>
                    <Stars rating={r.rating} colors={colors} />
                  </View>
                  {r.comment ? (
                    <Text style={[styles.reviewComment, { color: colors.mutedForeground }]}>
                      {r.comment}
                    </Text>
                  ) : null}
                </View>
              ))}
            </Section>
          ) : null}
        </View>
      </ScrollView>

      <GuestModal
        visible={guestModal}
        onClose={() => setGuestModal(false)}
        message="Iniciá sesión para reservar una mesa"
      />
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      <View style={{ gap: 10 }}>{children}</View>
    </View>
  );
}

function SecondaryAction({
  icon,
  label,
  onPress,
  colors,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.secondaryAction,
        {
          backgroundColor: colors.muted,
          borderColor: colors.border,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <Feather name={icon} size={16} color={colors.foreground} />
      <Text style={[styles.secondaryText, { color: colors.foreground }]}>{label}</Text>
    </Pressable>
  );
}

function InfoRow({
  icon,
  text,
  colors,
}: {
  icon: keyof typeof Feather.glyphMap;
  text: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.infoRow}>
      <Feather name={icon} size={16} color={colors.mutedForeground} />
      <Text style={[styles.infoText, { color: colors.foreground }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },
  errText: { fontSize: 14, textAlign: "center" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
  },
  heroBtn: { backgroundColor: "rgba(0,0,0,0.2)" },
  hero: {
    height: 200,
  },
  heroIcon: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
    marginTop: -8,
  },
  ratingText: { fontSize: 14, fontWeight: "700" },
  metaMuted: { fontSize: 13 },
  description: { fontSize: 14, lineHeight: 20, marginTop: -4 },
  actionsRow: { flexDirection: "row", gap: 12 },
  actionFlex: { flex: 1 },
  secondaryRow: { flexDirection: "row", gap: 12 },
  secondaryAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryText: { fontSize: 14, fontWeight: "600" },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  infoText: { fontSize: 14, flex: 1 },
  emptyInline: { fontSize: 13 },
  hoursWrap: { gap: 8 },
  hoursHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  hoursTitle: { fontSize: 14, fontWeight: "700" },
  hoursRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: 24,
  },
  hoursDay: { fontSize: 13 },
  hoursTime: { fontSize: 13, fontWeight: "600" },
  pointsCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 14,
  },
  pointsIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  pointsTitle: { fontSize: 15, fontWeight: "700" },
  pointsDesc: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "700", letterSpacing: -0.3 },
  dishRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  dishImg: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  dishName: { fontSize: 14, fontWeight: "600", flex: 1 },
  dishPrice: { fontSize: 14, fontWeight: "700" },
  menuCategory: { fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  promoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  promoTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  promoTagText: { fontSize: 13, fontWeight: "800" },
  promoTitle: { fontSize: 14, fontWeight: "600" },
  promoDesc: { fontSize: 13, marginTop: 2 },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  benefitName: { fontSize: 14, fontWeight: "600" },
  benefitDesc: { fontSize: 13, marginTop: 2 },
  benefitDiscount: { fontSize: 16, fontWeight: "800" },
  reviewRow: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reviewName: { fontSize: 14, fontWeight: "700" },
  reviewComment: { fontSize: 13, lineHeight: 18 },
});
