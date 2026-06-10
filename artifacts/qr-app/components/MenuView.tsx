import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { Menu, MenuProduct, TimeSlot } from "@/types";
import { ProductCard } from "@/components/ProductCard";
import { ProductCardSkeleton } from "@/components/Skeleton";

interface MenuViewProps {
  menu: Menu | null;
  loading?: boolean;
  currentTimeSlot?: TimeSlot | null;
  onSelectTimeSlot?: (slot: TimeSlot) => void;
  onSelectProduct: (product: MenuProduct) => void;
}

export function MenuView({
  menu,
  loading,
  currentTimeSlot,
  onSelectTimeSlot,
  onSelectProduct,
}: MenuViewProps) {
  const colors = useColors();
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories = menu?.categories ?? [];
  const timeSlots = menu?.time_slots ?? [];

  const products = useMemo(() => {
    const all = menu?.products ?? [];
    if (activeCategory === "all") return all;
    return all.filter((p) => p.category_id === activeCategory);
  }, [menu?.products, activeCategory]);

  if (loading) {
    return (
      <View style={styles.skeletonWrap}>
        {[0, 1, 2, 3].map((i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </View>
    );
  }

  if (!menu || (menu.products?.length ?? 0) === 0) {
    return (
      <View style={styles.empty}>
        <Feather name="book-open" size={44} color={colors.border} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
          Menú no disponible
        </Text>
        <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
          No hay productos para mostrar en este momento
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {timeSlots.length > 0 ? (
        <View style={styles.slotSection}>
          <Text style={[styles.slotLabel, { color: colors.mutedForeground }]}>
            Horario
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipList}
          >
            {timeSlots.map((slot) => {
              const active = currentTimeSlot?.id === slot.id;
              return (
                <Pressable
                  key={slot.id}
                  onPress={() => onSelectTimeSlot?.(slot)}
                  style={[
                    styles.slotChip,
                    {
                      backgroundColor: active ? colors.primary : colors.muted,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Feather
                    name="clock"
                    size={12}
                    color={active ? "#FFFFFF" : colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.slotChipText,
                      { color: active ? "#FFFFFF" : colors.foreground },
                    ]}
                  >
                    {slot.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {categories.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipList}
          style={styles.categoryRow}
        >
          <CategoryChip
            label="Todos"
            active={activeCategory === "all"}
            onPress={() => setActiveCategory("all")}
          />
          {categories.map((cat) => (
            <CategoryChip
              key={cat.id}
              label={cat.name}
              active={activeCategory === cat.id}
              onPress={() => setActiveCategory(cat.id)}
            />
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.productList}>
        {products.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="inbox" size={36} color={colors.border} />
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              No hay productos en esta categoría
            </Text>
          </View>
        ) : (
          products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onPress={() => onSelectProduct(p)}
            />
          ))
        )}
      </View>
    </View>
  );
}

function CategoryChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.categoryChip,
        { backgroundColor: active ? colors.primary : colors.muted },
      ]}
    >
      <Text
        style={[
          styles.categoryChipText,
          { color: active ? "#FFFFFF" : colors.foreground },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  slotSection: {
    gap: 8,
  },
  slotLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chipList: {
    gap: 8,
    paddingRight: 8,
  },
  slotChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  slotChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  categoryRow: {
    marginHorizontal: -2,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  productList: {
    gap: 0,
  },
  skeletonWrap: {
    paddingVertical: 8,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
