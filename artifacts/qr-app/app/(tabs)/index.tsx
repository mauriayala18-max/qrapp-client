import React, { useEffect, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useAuthStore } from "@/stores/authStore";
import { RestaurantCard } from "@/components/RestaurantCard";
import { GuestModal } from "@/components/GuestModal";
import { notificationService } from "@/services/notifications";
import { restaurantService } from "@/services/restaurants";
import { profileService, FavoriteRestaurant } from "@/services/profile";
import {
  reservationService,
  Reservation as ApiReservation,
} from "@/services/reservations";
import { Promotion, Restaurant, RestaurantSearchResult } from "@/types";

const UNREAD_POLL_MS = 30000;

function searchResultToRestaurant(r: RestaurantSearchResult): Restaurant {
  return {
    id: r.id,
    name: r.name,
    cuisine_type: r.cuisine_type,
    rating: r.rating ?? 0,
    color: r.color,
  };
}

function favoriteToRestaurant(f: FavoriteRestaurant): Restaurant {
  return {
    id: f.restaurant_id ?? f.id,
    name: f.name,
    cuisine_type: f.cuisine_type ?? "",
    rating: f.rating ?? 0,
    color: f.color,
  };
}

function formatCountdown(date: string, time: string): string | null {
  const target = new Date(`${date}T${time || "00:00"}`);
  if (Number.isNaN(target.getTime())) return null;
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return "Ahora";
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const dayCount = Math.floor(hours / 24);
  if (dayCount >= 1) return `En ${dayCount} día${dayCount > 1 ? "s" : ""}`;
  if (hours >= 1) return `En ${hours} h`;
  return `En ${minutes} min`;
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isGuest = useAuthStore((s) => s.isGuest);
  const [guestModal, setGuestModal] = useState(false);
  const [guestMessage, setGuestMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [nearby, setNearby] = useState<RestaurantSearchResult[]>([]);
  const [favorites, setFavorites] = useState<FavoriteRestaurant[]>([]);
  const [nextReservation, setNextReservation] = useState<ApiReservation | null>(
    null,
  );
  const [now, setNow] = useState(Date.now());

  // Public content: promotions and nearby restaurants (graceful empty).
  useEffect(() => {
    let active = true;
    restaurantService
      .getPromotions()
      .then((p) => active && setPromotions(p))
      .catch(() => active && setPromotions([]));
    restaurantService
      .getNearby()
      .then((r) => active && setNearby(r))
      .catch(() => active && setNearby([]));
    return () => {
      active = false;
    };
  }, []);

  // Personalised content reloads on focus for authenticated users.
  useFocusEffect(
    React.useCallback(() => {
      if (isGuest) {
        setUnreadCount(0);
        setFavorites([]);
        setNextReservation(null);
        return;
      }
      let active = true;

      const fetchCount = async () => {
        try {
          const count = await notificationService.getUnreadCount();
          if (active) setUnreadCount(count);
        } catch {
          // ignore polling errors
        }
      };
      fetchCount();
      const interval = setInterval(fetchCount, UNREAD_POLL_MS);

      profileService
        .getUserFavorites()
        .then((f) => active && setFavorites(f.restaurants))
        .catch(() => active && setFavorites([]));

      reservationService
        .getMyReservations({ upcoming: true })
        .then((list) => {
          if (!active) return;
          const upcoming = list
            .filter((r) => r.status === "confirmed" || r.status === "pending")
            .sort((a, b) =>
              `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`),
            );
          setNextReservation(upcoming[0] ?? null);
        })
        .catch(() => active && setNextReservation(null));

      return () => {
        active = false;
        clearInterval(interval);
      };
    }, [isGuest]),
  );

  // Tick the countdown once a minute while the screen is mounted.
  useEffect(() => {
    if (!nextReservation) return;
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, [nextReservation]);
  void now;

  const handleProtectedAction = (msg?: string) => {
    if (isGuest) {
      setGuestMessage(msg ?? "");
      setGuestModal(true);
      return true;
    }
    return false;
  };

  const handleQRScan = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/scanner");
  };

  const handleReserve = () => {
    if (handleProtectedAction("Iniciá sesión para reservar una mesa")) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/reservations/new");
  };

  const handlePoints = () => {
    if (handleProtectedAction("Iniciá sesión para ver tus puntos")) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/profile/points");
  };

  const handlePromotion = (promo: Promotion) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (promo.branch_id) router.push(`/restaurant/${promo.branch_id}`);
  };

  const handleOpenRestaurant = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/restaurant/${id}`);
  };

  const firstName = user?.full_name?.split(" ")[0] ?? "ahí";
  const paddingTop = insets.top + (Platform.OS === "web" ? 67 : 0);
  const paddingBottom = insets.bottom + 100;

  const countdown = nextReservation
    ? formatCountdown(nextReservation.date, nextReservation.time)
    : null;

  const renderPromotion = ({ item }: { item: Promotion }) => (
    <Pressable
      onPress={() => handlePromotion(item)}
      style={({ pressed }) => [
        styles.promoCard,
        { backgroundColor: item.color || colors.primary, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={styles.promoBadge}>
        <Text style={styles.promoBadgeText}>{item.discount}</Text>
      </View>
      <Text style={styles.promoTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.promoRestaurant}>{item.restaurant}</Text>
    </Pressable>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop, paddingBottom }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topHeader}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            Hola,
          </Text>
          <Text style={[styles.userName, { color: colors.foreground }]}>
            {isGuest ? "Invitado" : firstName}
          </Text>
        </View>
        {!isGuest ? (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/notifications");
            }}
            style={[styles.bellButton, { backgroundColor: colors.muted }]}
            hitSlop={8}
          >
            <Feather name="bell" size={20} color={colors.foreground} />
            {unreadCount > 0 ? (
              <View
                style={[
                  styles.bellBadge,
                  { backgroundColor: colors.primary, borderColor: colors.background },
                ]}
              >
                <Text style={styles.bellBadgeText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        ) : null}
      </View>

      {/* Points card */}
      {!isGuest ? (
        <Pressable
          onPress={handlePoints}
          style={({ pressed }) => [
            styles.pointsCard,
            { backgroundColor: colors.primary, opacity: pressed ? 0.92 : 1 },
          ]}
        >
          <View style={styles.pointsLeft}>
            <View style={styles.pointsIconWrap}>
              <Feather name="award" size={22} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.pointsCardLabel}>Mis puntos</Text>
              <Text style={styles.pointsCardValue}>
                {user?.points ?? 0} pts
              </Text>
            </View>
          </View>
          <View style={styles.pointsCta}>
            <Text style={styles.pointsCtaText}>Canjear</Text>
            <Feather name="chevron-right" size={18} color="#FFFFFF" />
          </View>
        </Pressable>
      ) : null}

      {/* Next reservation */}
      {!isGuest && nextReservation ? (
        <Pressable
          onPress={() => router.push("/profile/reservations")}
          style={({ pressed }) => [
            styles.reservationCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <View style={[styles.reservationIcon, { backgroundColor: colors.success + "1A" }]}>
            <Feather name="calendar" size={20} color={colors.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.reservationLabel, { color: colors.mutedForeground }]}>
              Próxima reserva
            </Text>
            <Text style={[styles.reservationName, { color: colors.foreground }]} numberOfLines={1}>
              {nextReservation.restaurant_name ?? "Tu reserva"}
            </Text>
            <Text style={[styles.reservationMeta, { color: colors.mutedForeground }]}>
              {nextReservation.date} · {nextReservation.time} ·{" "}
              {nextReservation.party_size} pers.
            </Text>
          </View>
          {countdown ? (
            <View style={[styles.countdownBadge, { backgroundColor: colors.success }]}>
              <Text style={styles.countdownText}>{countdown}</Text>
            </View>
          ) : null}
        </Pressable>
      ) : null}

      {/* QR scan */}
      <Pressable
        onPress={handleQRScan}
        style={({ pressed }) => [
          styles.qrButton,
          {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.35,
            shadowRadius: 20,
            elevation: 8,
            transform: [{ scale: pressed ? 0.97 : 1 }],
          },
        ]}
      >
        <View style={styles.qrInner}>
          <Feather name="maximize" size={40} color="#FFFFFF" />
        </View>
        <Text style={styles.qrText}>Escanear QR</Text>
        <Text style={styles.qrSubtext}>Apuntá al código de tu mesa</Text>
      </Pressable>

      {/* Reserve action */}
      <Pressable
        onPress={handleReserve}
        style={({ pressed }) => [
          styles.reserveButton,
          {
            backgroundColor: colors.muted,
            borderColor: colors.border,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <Feather name="calendar" size={18} color={colors.primary} />
        <Text style={[styles.reserveText, { color: colors.foreground }]}>
          Reservar una mesa
        </Text>
        <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
      </Pressable>

      {/* Promotions */}
      {promotions.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Promociones destacadas
            </Text>
          </View>
          <FlatList
            data={promotions}
            renderItem={renderPromotion}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.promoList}
          />
        </View>
      ) : null}

      {/* Favorites */}
      {!isGuest && favorites.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Mis favoritos
            </Text>
            <Pressable hitSlop={8} onPress={() => router.push("/profile/favorites")}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>Ver todos</Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.promoList}
          >
            {favorites.map((f) => {
              const r = favoriteToRestaurant(f);
              return (
                <RestaurantCard
                  key={f.id}
                  restaurant={r}
                  compact
                  onPress={() => handleOpenRestaurant(r.id)}
                />
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {/* Nearby */}
      {nearby.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Restaurantes cerca tuyo
            </Text>
          </View>
          {nearby.map((item, i) => {
            const r = searchResultToRestaurant(item);
            return (
              <RestaurantCard
                key={item.id}
                restaurant={r}
                index={i}
                onPress={() => handleOpenRestaurant(item.id)}
              />
            );
          })}
        </View>
      ) : null}

      <GuestModal
        visible={guestModal}
        onClose={() => setGuestModal(false)}
        message={guestMessage || undefined}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    gap: 0,
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: 20,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 15,
  },
  userName: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  bellBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  bellBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  pointsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
  },
  pointsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  pointsIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  pointsCardLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
  },
  pointsCardValue: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  pointsCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  pointsCtaText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  reservationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  reservationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  reservationLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  reservationName: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 1,
  },
  reservationMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  countdownBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  countdownText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  qrButton: {
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  qrInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  qrText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  qrSubtext: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
  },
  reserveButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    marginBottom: 28,
  },
  reserveText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: "600",
  },
  promoList: {
    paddingRight: 4,
  },
  promoCard: {
    width: 180,
    borderRadius: 14,
    padding: 16,
    marginRight: 12,
    gap: 6,
    minHeight: 110,
    justifyContent: "flex-end",
  },
  promoBadge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 4,
  },
  promoBadgeText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
  },
  promoTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  promoRestaurant: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
  },
});
