import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

interface RatingInputProps {
  value: number;
  onChange: (value: number) => void;
  size?: number;
  gap?: number;
}

export function RatingInput({
  value,
  onChange,
  size = 32,
  gap = 8,
}: RatingInputProps) {
  const colors = useColors();

  return (
    <View style={[styles.row, { gap }]}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Pressable
          key={i}
          hitSlop={6}
          onPress={() => {
            Haptics.selectionAsync();
            onChange(i);
          }}
        >
          <FontAwesome
            name="star"
            size={size}
            color={i <= value ? "#FFB800" : colors.border}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});
