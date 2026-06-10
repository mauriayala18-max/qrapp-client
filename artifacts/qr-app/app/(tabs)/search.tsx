import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { ProductCard } from "@/components/ProductCard";
import { ProductCardSkeleton } from "@/components/Skeleton";
import { MenuProduct } from "@/types";

export default function SearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const session = useSessionStore((s) => s.session);
  const branchId = session?.branch?.id;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MenuProduct[]>([]);
  const [featured, setFeatured] = useState<MenuProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial state: featured products when in a session.
  useEffect(() => {
    let active = true;
    if (branchId) {
      menuService
        .getFeatured(branchId)
        .then((p) => active && setFeatured(p))
        .catch(() => active && setFeatured([]));
    } else {
      setFeatured([]);
    }
    return () => {
      active = false;
    };
  }, [branchId]);

  // Debounced search.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim();

    if (!trimmed || !branchId) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await menuService.searchMenu(branchId, trimmed);
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
        setSearched(true);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, branchId]);

  const openProduct = (product: MenuProduct) => {
    router.push(`/product/${product.id}`);
  };

  const paddingTop = insets.top + (Platform.OS === "web" ? 67 : 0);
  const paddingBottom = insets.bottom + 100;

  const hasQuery = query.trim().length > 0;

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
            placeholder={branchId ? "Buscá en el menú..." : "Buscá restaurantes..."}
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
            clearButtonMode="while-editing"
            autoCorrect={false}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.results, { paddingBottom }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!branchId ? (
          <View style={styles.empty}>
            <Feather name="maximize" size={48} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Escaneá una mesa
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              Uníte a una mesa para buscar y explorar su menú
            </Text>
          </View>
        ) : loading ? (
          <View style={styles.skeletonWrap}>
            {[0, 1, 2, 3].map((i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </View>
        ) : hasQuery ? (
          results.length === 0 && searched ? (
            <View style={styles.empty}>
              <Feather name="search" size={48} color={colors.border} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                Sin resultados
              </Text>
              <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
                No encontramos resultados para "{query.trim()}"
              </Text>
            </View>
          ) : (
            <>
              <Text style={[styles.resultCount, { color: colors.mutedForeground }]}>
                {results.length} resultado{results.length !== 1 ? "s" : ""}
              </Text>
              {results.map((p) => (
                <ProductCard key={p.id} product={p} onPress={() => openProduct(p)} />
              ))}
            </>
          )
        ) : featured.length > 0 ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Destacados
            </Text>
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} onPress={() => openProduct(p)} />
            ))}
          </>
        ) : (
          <View style={styles.empty}>
            <Feather name="search" size={48} color={colors.border} />
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              Empezá a escribir para buscar en el menú
            </Text>
          </View>
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
  results: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  resultCount: {
    fontSize: 13,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  skeletonWrap: {
    paddingTop: 4,
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
    paddingHorizontal: 32,
  },
});
