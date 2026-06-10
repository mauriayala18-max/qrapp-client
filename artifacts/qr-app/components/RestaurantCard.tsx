import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { Restaurant } from "@/types";

const CARD_COLORS = [
  "#FF6B35",
  "#E17055",
  "#6C5CE7",
  "#0984E3",
  "#00B894",
  "#2D3436",
  "#FDCB6E",
  "#E84393",
];

interface RestaurantCardProps {
  restaurant: Restaurant;
  onPress?: () => void;
  index?: number;
  compact?: boolean;
}

export function RestaurantCard({
  restaurant,
  onPress,
  index = 0,
  compact = false,
}: RestaurantCardProps) {
  const colors = useColors();
  const cardColor = restaurant.color ?? CARD_COLORS[index % CARD_COLORS.length];

  const renderStars = (rating: number) => {
    const full = Math.floor(rating);
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Feather
          key={i}
          name="star"
          size={12}
          color={i < full ? "#FDCB6E" : colors.border}
        />,
      );
    }
    return stars;
  };

  if (compact) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.compactCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            opacity: pressed ? 0.85 : 1,
            width: 160,
          },
        ]}
        onPress={onPress}
      >
        <View
          style={[
            styles.compactImage,
            { backgroundColor: cardColor },
          ]}
        >
          <Feather name="coffee" size={28} color="rgba(255,255,255,0.9)" />
        </View>
        <View style={styles.compactInfo}>
          <Text
            style={[styles.compactName, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {restaurant.name}
          </Text>
          <Text
            style={[styles.compactCuisine, { color: colors.mutedForeground }]}
          >
            {restaurant.cuisine_type}
          </Text>
          <View style={styles.ratingRow}>
            {renderStars(restaurant.rating)}
            <Text
              style={[styles.ratingText, { color: colors.mutedForeground }]}
            >
              {" "}
              {restaurant.rating.toFixed(1)}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
      onPress={onPress}
    >
      <View style={[styles.image, { backgroundColor: cardColor }]}>
        <Feather name="coffee" size={32} color="rgba(255,255,255,0.9)" />
      </View>
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text
            style={[styles.name, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {restaurant.name}
          </Text>
          <View
            style={[styles.ratingBadge, { backgroundColor: colors.muted }]}
          >
            <Feather name="star" size={11} color="#FDCB6E" />
            <Text
              style={[styles.ratingBadgeText, { color: colors.foreground }]}
            >
              {" "}
              {restaurant.rating.toFixed(1)}
            </Text>
          </View>
        </View>
        <Text style={[styles.cuisine, { color: colors.mutedForeground }]}>
          {restaurant.cuisine_type}
        </Text>
        {restaurant.distance ? (
          <View style={styles.distanceRow}>
            <Feather name="map-pin" size={12} color={colors.mutedForeground} />
            <Text
              style={[styles.distance, { color: colors.mutedForeground }]}
            >
              {" "}
              {restaurant.distance}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 12,
  },
  image: {
    width: 88,
    height: 88,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
    gap: 4,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  cuisine: {
    fontSize: 13,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ratingBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  distance: {
    fontSize: 12,
  },
  compactCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginRight: 12,
  },
  compactImage: {
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  compactInfo: {
    padding: 10,
    gap: 3,
  },
  compactName: {
    fontSize: 14,
    fontWeight: "600",
  },
  compactCuisine: {
    fontSize: 12,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  ratingText: {
    fontSize: 11,
  },
});
