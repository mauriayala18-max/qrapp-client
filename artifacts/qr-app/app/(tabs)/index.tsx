import React, { useState } from "react";
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
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useAuthStore } from "@/stores/authStore";
import { RestaurantCard } from "@/components/RestaurantCard";
import { GuestModal } from "@/components/GuestModal";
import { Restaurant, Promotion } from "@/types";

const PROMOTIONS: Promotion[] = [
  { id: "1", title: "2x1 en bebidas", restaurant: "La Paraguaya", discount: "2x1", color: "#FF6B35" },
  { id: "2", title: "Menú del día", restaurant: "La Española", discount: "20% OFF", color: "#00B894" },
  { id: "3", title: "Pizza familiar gratis", restaurant: "Il Forno", discount: "Gratis", color: "#6C5CE7" },
  { id: "4", title: "Sushi combo", restaurant: "Sushi Tokyo", discount: "15% OFF", color: "#E17055" },
];

const RESTAURANTS: Restaurant[] = [
  { id: "1", name: "La Paraguaya", cuisine_type: "Paraguaya", rating: 4.8, distance: "0.3 km", color: "#FF6B35" },
  { id: "2", name: "Sushi Tokyo", cuisine_type: "Japonesa", rating: 4.5, distance: "0.8 km", color: "#E17055" },
  { id: "3", name: "La Española", cuisine_type: "Española", rating: 4.6, distance: "1.2 km", color: "#6C5CE7" },
  { id: "4", name: "Pizzería Il Forno", cuisine_type: "Italiana", rating: 4.3, distance: "1.5 km", color: "#0984E3" },
  { id: "5", name: "China Garden", cuisine_type: "China", rating: 4.2, distance: "2.1 km", color: "#00B894" },
];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isGuest = useAuthStore((s) => s.isGuest);
  const [guestModal, setGuestModal] = useState(false);
  const [guestMessage, setGuestMessage] = useState("");

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

  const handlePromotion = (promo: Promotion) => {
    if (handleProtectedAction("Iniciá sesión para acceder a las promociones")) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const firstName = user?.full_name?.split(" ")[0] ?? "ahí";
  const paddingTop = insets.top + (Platform.OS === "web" ? 67 : 0);
  const paddingBottom = insets.bottom + 100;

  const renderPromotion = ({ item }: { item: Promotion }) => (
    <Pressable
      onPress={() => handlePromotion(item)}
      style={({ pressed }) => [
        styles.promoCard,
        { backgroundColor: item.color, opacity: pressed ? 0.85 : 1 },
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
          <View style={[styles.pointsBadge, { backgroundColor: colors.primary + "15" }]}>
            <Feather name="award" size={14} color={colors.primary} />
            <Text style={[styles.pointsValue, { color: colors.primary }]}>
              {user?.points ?? 0}
            </Text>
            <Text style={[styles.pointsLabel, { color: colors.primary }]}>
              pts
            </Text>
          </View>
        ) : null}
      </View>

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

      <Pressable
        style={({ pressed }) => [
          styles.advanceButton,
          {
            backgroundColor: colors.muted,
            borderColor: colors.border,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
        onPress={() => {}}
      >
        <Feather name="clock" size={18} color={colors.foreground} />
        <Text style={[styles.advanceText, { color: colors.foreground }]}>
          Pedir anticipadamente
        </Text>
        <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
      </Pressable>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Promociones destacadas
          </Text>
          <Pressable hitSlop={8}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>Ver todas</Text>
          </Pressable>
        </View>
        <FlatList
          data={PROMOTIONS}
          renderItem={renderPromotion}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.promoList}
          scrollEnabled={PROMOTIONS.length > 0}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Restaurantes cerca tuyo
          </Text>
          <Pressable hitSlop={8}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>Ver todos</Text>
          </Pressable>
        </View>
        {RESTAURANTS.map((r, i) => (
          <RestaurantCard
            key={r.id}
            restaurant={r}
            index={i}
            onPress={() => {}}
          />
        ))}
      </View>

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
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 15,
  },
  userName: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  pointsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pointsValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  pointsLabel: {
    fontSize: 12,
    fontWeight: "500",
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
  advanceButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    marginBottom: 28,
  },
  advanceText: {
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
