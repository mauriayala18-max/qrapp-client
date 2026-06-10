import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { formatRating } from "@/utils/format";

interface StarRatingProps {
  rating?: number | null;
  reviewsCount?: number;
  size?: number;
  showNumber?: boolean;
}

export function StarRating({
  rating,
  reviewsCount,
  size = 13,
  showNumber = true,
}: StarRatingProps) {
  const colors = useColors();
  const value = rating ?? 0;

  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = value >= i;
        const half = !filled && value >= i - 0.5;
        return (
          <FontAwesome
            key={i}
            name={half ? "star-half-full" : "star"}
            size={size}
            color={filled || half ? "#FFB800" : colors.border}
          />
        );
      })}
      {showNumber ? (
        <Text style={[styles.text, { color: colors.mutedForeground, fontSize: size }]}>
          {formatRating(rating)}
          {reviewsCount != null ? ` (${reviewsCount})` : ""}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  text: {
    marginLeft: 4,
    fontWeight: "500",
  },
});
