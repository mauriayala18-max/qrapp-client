import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useSessionStore } from "@/stores/sessionStore";
import { menuService } from "@/services/menu";
import { restaurantService } from "@/services/restaurants";
import { ProductCard } from "@/components/ProductCard";
import { ProductCardSkeleton } from "@/components/Skeleton";
import {
  DishSearchResult,
  MenuProduct,
  RestaurantSearchResult,
  SearchResults,
} from "@/types";

type Mode = "global" | "menu";

const CUISINES: { label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { label: "Paraguaya", icon: "home" },
  { label: "Parrilla", icon: "zap" },
  { label: "Italiana", icon: "circle" },
  { label: "Japonesa", icon: "anchor" },
  { label: "China", icon: "box" },
  { label: "Española", icon: "sun" },
  { label: "Hamburguesas", icon: "disc" },
  { label: "Pizzería", icon: "target" },
  { label: "Vegetariana", icon: "feather" },
  { label: "Cafetería", icon: "coffee" },
  { label: "Postres", icon: "gift" },
  { label: "Mariscos", icon: "droplet" },
];

const DIETARY = ["Vegetariano", "Vegano", "Sin TACC", "Sin lactosa"];

const CUISINE_COLORS = [
  "#FF6B35",
  "#E17055",
  "#6C5CE7",
  "#0984E3",
  "#00B894",
  "#E84393",
  "#FDCB6E",
  "#2D3436",
];

export default function SearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const session = useSessionStore((s) => s.session);
  const branchId = session?.branch?.id;
  const restaurantName = session?.restaurant?.name;

  const [mode, setMode] = useState<Mode>("global");
  const [query, setQuery] = useState("");
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [dietary, setDietary] = useState<string[]>([]);

  const [results, setResults] = useState<SearchResults>({
    restaurants: [],
    dishes: [],
  });
  const [menuResults, setMenuResults] = useState<MenuProduct[]>([]);
  const [featured, setFeatured] = useState<MenuProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Featured dishes for the in-session menu mode.
  useEffect(() => {
    let active = true;
    if (branchId) {
      menuService
        .getFeatured(branchId)
        .then((p) => active && setFeatured(p))
        .catch(() => active && setFeatured([]));
    } else {
      setFeatured([]);
      setMode("global");
    }
    return () => {
      active = false;
    };
  }, [branchId]);

  const toggle = (value: string, list: string[], setList: (v: string[]) => void) => {
    setList(
      list.includes(value)
        ? list.filter((x) => x !== value)
        : [...list, value],
    );
  };

  const hasQuery = query.trim().length > 0;
  const hasFilters = cuisines.length > 0 || dietary.length > 0;
  const isSearchingGlobal = mode === "global" && (hasQuery || hasFilters);

  // Debounced search effect.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim();

    if (mode === "menu") {
      if (!trimmed || !branchId) {
        setMenuResults([]);
        setSearched(false);
        setLoading(false);
        return;
      }
      setLoading(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const data = await menuService.searchMenu(branchId, trimmed);
          setMenuResults(data);
        } catch {
          setMenuResults([]);
        } finally {
          setLoading(false);
          setSearched(true);
        }
      }, 300);
      return () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
      };
    }

    // global mode
    if (!trimmed && !hasFilters) {
      setResults({ restaurants: [], dishes: [] });
      setSearched(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await restaurantService.search(trimmed, {
          cuisines,
          dietary,
        });
        setResults(data);
      } catch {
        setResults({ restaurants: [], dishes: [] });
      } finally {
        setLoading(false);
        setSearched(true);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, mode, branchId, cuisines, dietary, hasFilters]);

  const openRestaurant = useCallback(
    (r: RestaurantSearchResult) => router.push(`/restaurant/${r.id}`),
    [router],
  );

  const openDish = useCallback(
    (d: DishSearchResult) => {
      const target = d.branch_id ?? d.restaurant_id;
      if (target) router.push(`/restaurant/${target}`);
      else router.push(`/product/${d.id}`);
    },
    [router],
  );

  const openMenuProduct = useCallback(
    (p: MenuProduct) => router.push(`/product/${p.id}`),
    [router],
  );

  const selectCuisine = (label: string) => {
    setMode("global");
    setCuisines((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label],
    );
  };

  const paddingTop = insets.top + (Platform.OS === "web" ? 67 : 0);
  const paddingBottom = insets.bottom + 100;

  const totalResults =
    results.restaurants.length + results.dishes.length;

  const cuisineCards = useMemo(
    () =>
      CUISINES.map((c, i) => ({
        ...c,
        color: CUISINE_COLORS[i % CUISINE_COLORS.length],
      })),
    [],
  );

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
            placeholder={
              mode === "menu"
                ? "Buscá en el menú de esta mesa…"
                : "Buscá restaurantes o platos…"
            }
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>

        {branchId ? (
          <View style={styles.modeRow}>
            {(
              [
                ["global", "Restaurantes"],
                ["menu", "Esta mesa"],
              ] as [Mode, string][]
            ).map(([key, label]) => {
              const active = mode === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => {
                    setMode(key);
                    setQuery("");
                    setSearched(false);
                  }}
                  style={[
                    styles.modeChip,
                    {
                      backgroundColor: active ? colors.primary : colors.muted,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.modeChipText,
                      { color: active ? "#FFFFFF" : colors.foreground },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={[styles.results, { paddingBottom }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {mode === "menu" ? (
          // ---------- IN-SESSION MENU SEARCH ----------
          loading ? (
            <View style={styles.skeletonWrap}>
              {[0, 1, 2, 3].map((i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </View>
          ) : hasQuery ? (
            menuResults.length === 0 && searched ? (
              <Empty
                icon="search"
                title="Sin resultados"
                desc={`No encontramos platos para "${query.trim()}"`}
                colors={colors}
              />
            ) : (
              <>
                <Text style={[styles.resultCount, { color: colors.mutedForeground }]}>
                  {menuResults.length} plato{menuResults.length !== 1 ? "s" : ""}
                </Text>
                {menuResults.map((p) => (
                  <ProductCard key={p.id} product={p} onPress={() => openMenuProduct(p)} />
                ))}
              </>
            )
          ) : featured.length > 0 ? (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Destacados {restaurantName ? `· ${restaurantName}` : ""}
              </Text>
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} onPress={() => openMenuProduct(p)} />
              ))}
            </>
          ) : (
            <Empty
              icon="search"
              desc="Empezá a escribir para buscar en el menú de esta mesa"
              colors={colors}
            />
          )
        ) : (
          // ---------- GLOBAL SEARCH ----------
          <>
            {/* Filters */}
            <Text style={[styles.filterLabel, { color: colors.foreground }]}>
              Tipo de cocina
            </Text>
            <View style={styles.chipWrap}>
              {CUISINES.map((c) => {
                const active = cuisines.includes(c.label);
                return (
                  <Pressable
                    key={c.label}
                    onPress={() => toggle(c.label, cuisines, setCuisines)}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: active ? colors.primary : colors.muted,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        { color: active ? "#FFFFFF" : colors.foreground },
                      ]}
                    >
                      {c.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.filterLabel, { color: colors.foreground }]}>
              Preferencias
            </Text>
            <View style={styles.chipWrap}>
              {DIETARY.map((d) => {
                const active = dietary.includes(d);
                return (
                  <Pressable
                    key={d}
                    onPress={() => toggle(d, dietary, setDietary)}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: active ? colors.success : colors.muted,
                        borderColor: active ? colors.success : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        { color: active ? "#FFFFFF" : colors.foreground },
                      ]}
                    >
                      {d}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {isSearchingGlobal ? (
              loading ? (
                <View style={styles.skeletonWrap}>
                  {[0, 1, 2, 3].map((i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </View>
              ) : totalResults === 0 && searched ? (
                <Empty
                  icon="search"
                  title="Sin resultados"
                  desc="Probá con otra búsqueda o quitá algunos filtros"
                  colors={colors}
                />
              ) : (
                <>
                  {results.restaurants.length > 0 ? (
                    <>
                      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                        Restaurantes
                      </Text>
                      {results.restaurants.map((r) => (
                        <RestaurantResultRow
                          key={r.id}
                          item={r}
                          colors={colors}
                          onPress={() => openRestaurant(r)}
                        />
                      ))}
                    </>
                  ) : null}
                  {results.dishes.length > 0 ? (
                    <>
                      <Text
                        style={[
                          styles.sectionTitle,
                          { color: colors.foreground, marginTop: 20 },
                        ]}
                      >
                        Platos
                      </Text>
                      {results.dishes.map((d) => (
                        <DishResultRow
                          key={d.id}
                          item={d}
                          colors={colors}
                          onPress={() => openDish(d)}
                        />
                      ))}
                    </>
                  ) : null}
                </>
              )
            ) : (
              // Initial cuisine grid
              <>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Explorá por categoría
                </Text>
                <View style={styles.grid}>
                  {cuisineCards.map((c) => (
                    <Pressable
                      key={c.label}
                      onPress={() => selectCuisine(c.label)}
                      style={({ pressed }) => [
                        styles.gridCard,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                          opacity: pressed ? 0.85 : 1,
                        },
                      ]}
                    >
                      <View
                        style={[styles.gridIcon, { backgroundColor: c.color + "1A" }]}
                      >
                        <Feather name={c.icon} size={20} color={c.color} />
                      </View>
                      <Text
                        style={[styles.gridLabel, { color: colors.foreground }]}
                        numberOfLines={1}
                      >
                        {c.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Empty({
  icon,
  title,
  desc,
  colors,
}: {
  icon: keyof typeof Feather.glyphMap;
  title?: string;
  desc: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.empty}>
      <Feather name={icon} size={48} color={colors.border} />
      {title ? (
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text>
      ) : null}
      <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>{desc}</Text>
    </View>
  );
}

function RestaurantResultRow({
  item,
  colors,
  onPress,
}: {
  item: RestaurantSearchResult;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={[styles.rowImage, { backgroundColor: item.color ?? colors.primary }]}>
        <Feather name="coffee" size={24} color="rgba(255,255,255,0.9)" />
      </View>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowName, { color: colors.foreground }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.rowMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
          {item.cuisine_type}
          {item.address ? ` · ${item.address}` : ""}
        </Text>
      </View>
      <View style={styles.rowRating}>
        <Feather name="star" size={12} color="#FDCB6E" />
        <Text style={[styles.rowRatingText, { color: colors.foreground }]}>
          {item.rating?.toFixed(1) ?? "—"}
        </Text>
      </View>
    </Pressable>
  );
}

function DishResultRow({
  item,
  colors,
  onPress,
}: {
  item: DishSearchResult;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={[styles.rowImage, { backgroundColor: colors.muted }]}>
        <Feather name="shopping-bag" size={22} color={colors.mutedForeground} />
      </View>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowName, { color: colors.foreground }]} numberOfLines={1}>
          {item.name}
        </Text>
        {item.restaurant_name ? (
          <Text style={[styles.rowMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
            {item.restaurant_name}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.rowPrice, { color: colors.primary }]}>
        Gs {item.price.toLocaleString("es-PY")}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  searchInput: { flex: 1, fontSize: 15 },
  modeRow: { flexDirection: "row", gap: 8 },
  modeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  modeChipText: { fontSize: 13, fontWeight: "600" },
  results: { paddingHorizontal: 20, paddingTop: 12 },
  filterLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 4,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 13, fontWeight: "500" },
  resultCount: { fontSize: 13, marginBottom: 12 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gridCard: {
    width: "47%",
    flexGrow: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  gridIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  gridLabel: { fontSize: 14, fontWeight: "600", flex: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  rowImage: {
    width: 52,
    height: 52,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowInfo: { flex: 1, gap: 2 },
  rowName: { fontSize: 15, fontWeight: "600" },
  rowMeta: { fontSize: 13 },
  rowRating: { flexDirection: "row", alignItems: "center", gap: 4 },
  rowRatingText: { fontSize: 13, fontWeight: "600" },
  rowPrice: { fontSize: 14, fontWeight: "700" },
  skeletonWrap: { paddingTop: 4 },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: "600" },
  emptyDesc: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
