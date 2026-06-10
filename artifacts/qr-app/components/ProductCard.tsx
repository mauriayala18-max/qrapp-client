import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { MenuProduct } from "@/types";
import { formatGs, formatPrepTime } from "@/utils/format";
import { StarRating } from "@/components/StarRating";

const PLACEHOLDER_COLORS = [
  "#FF6B35",
  "#E17055",
  "#6C5CE7",
  "#0984E3",
  "#00B894",
  "#FDCB6E",
  "#E84393",
];

function colorFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return PLACEHOLDER_COLORS[Math.abs(hash) % PLACEHOLDER_COLORS.length];
}

interface ProductCardProps {
  product: MenuProduct;
  onPress?: () => void;
}

export function ProductCard({ product, onPress }: ProductCardProps) {
  const colors = useColors();
  const placeholderColor = colorFor(product.id);
  const prep = formatPrepTime(product.prep_time_minutes);

  return (
    <Pressable
      onPress={onPress}
      disabled={!product.available}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.imageWrap}>
        {product.image ? (
          <Image source={{ uri: product.image }} style={styles.image} />
        ) : (
          <View style={[styles.image, { backgroundColor: placeholderColor + "22" }]}>
            <Feather name="coffee" size={28} color={placeholderColor} />
          </View>
        )}
        {product.featured ? (
          <View style={[styles.featuredBadge, { backgroundColor: colors.primary }]}>
            <Feather name="star" size={9} color="#FFFFFF" />
            <Text style={styles.featuredText}>Destacado</Text>
          </View>
        ) : null}
        {!product.available ? (
          <View style={styles.unavailableOverlay}>
            <Text style={styles.unavailableText}>No disponible</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text
          style={[styles.name, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {product.name}
        </Text>
        {product.description ? (
          <Text
            style={[styles.desc, { color: colors.mutedForeground }]}
            numberOfLines={2}
          >
            {product.description}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          {product.rating != null ? (
            <StarRating
              rating={product.rating}
              reviewsCount={product.reviews_count}
              size={11}
            />
          ) : null}
          {prep ? (
            <View style={styles.prep}>
              <Feather name="clock" size={11} color={colors.mutedForeground} />
              <Text style={[styles.prepText, { color: colors.mutedForeground }]}>
                {prep}
              </Text>
            </View>
          ) : null}
        </View>

        <Text style={[styles.price, { color: colors.primary }]}>
          {formatGs(product.price)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: 12,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  imageWrap: {
    width: 88,
    height: 88,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: 88,
    height: 88,
    alignItems: "center",
    justifyContent: "center",
  },
  featuredBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  featuredText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },
  unavailableOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  unavailableText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: 4,
  },
  body: {
    flex: 1,
    justifyContent: "center",
    gap: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  desc: {
    fontSize: 12,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 2,
  },
  prep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  prepText: {
    fontSize: 11,
    fontWeight: "500",
  },
  price: {
    fontSize: 15,
    fontWeight: "800",
    marginTop: 2,
  },
});
