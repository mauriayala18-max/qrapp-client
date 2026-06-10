import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { RestaurantCard } from "@/components/RestaurantCard";
import { Restaurant } from "@/types";

const CUISINE_FILTERS = [
  "Todas",
  "Paraguaya",
  "Argentina",
  "Japonesa",
  "Italiana",
  "China",
  "Mexicana",
  "Americana",
  "Española",
];

const ALL_RESTAURANTS: Restaurant[] = [
  { id: "1", name: "La Paraguaya", cuisine_type: "Paraguaya", rating: 4.8, distance: "0.3 km", color: "#FF6B35" },
  { id: "2", name: "Sushi Tokyo", cuisine_type: "Japonesa", rating: 4.5, distance: "0.8 km", color: "#E17055" },
  { id: "3", name: "La Española", cuisine_type: "Española", rating: 4.6, distance: "1.2 km", color: "#6C5CE7" },
  { id: "4", name: "Pizzería Il Forno", cuisine_type: "Italiana", rating: 4.3, distance: "1.5 km", color: "#0984E3" },
  { id: "5", name: "China Garden", cuisine_type: "China", rating: 4.2, distance: "2.1 km", color: "#00B894" },
  { id: "6", name: "El Rancho", cuisine_type: "Argentina", rating: 4.4, distance: "2.4 km", color: "#FDCB6E" },
  { id: "7", name: "Taco Loco", cuisine_type: "Mexicana", rating: 4.1, distance: "3.0 km", color: "#E84393" },
  { id: "8", name: "Burger Factory", cuisine_type: "Americana", rating: 4.0, distance: "3.5 km", color: "#2D3436" },
];

export default function SearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Todas");

  const filtered = ALL_RESTAURANTS.filter((r) => {
    const matchesQuery =
      !query.trim() ||
      r.name.toLowerCase().includes(query.toLowerCase()) ||
      r.cuisine_type.toLowerCase().includes(query.toLowerCase());
    const matchesCuisine =
      activeFilter === "Todas" || r.cuisine_type === activeFilter;
    return matchesQuery && matchesCuisine;
  });

  const paddingTop = insets.top + (Platform.OS === "web" ? 67 : 0);
  const paddingBottom = insets.bottom + 100;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: paddingTop + 16, backgroundColor: colors.background },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Buscar</Text>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.muted, borderColor: colors.border },
          ]}
        >
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Restaurantes, cocinas..."
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
            clearButtonMode="while-editing"
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
        >
          {CUISINE_FILTERS.map((f) => (
            <Pressable
              key={f}
              onPress={() => setActiveFilter(f)}
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    activeFilter === f ? colors.primary : colors.muted,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color:
                      activeFilter === f ? "#FFFFFF" : colors.foreground,
                  },
                ]}
              >
                {f}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.results,
          { paddingBottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="search" size={48} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Sin resultados
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              Probá con otro nombre o categoría
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.resultCount, { color: colors.mutedForeground }]}>
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
            </Text>
            {filtered.map((r, i) => (
              <RestaurantCard key={r.id} restaurant={r} index={i} onPress={() => {}} />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    gap: 14,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  filterList: {
    paddingRight: 4,
    gap: 8,
    paddingBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "500",
  },
  results: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  resultCount: {
    fontSize: 13,
    marginBottom: 12,
  },
  empty: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: "center",
  },
});
