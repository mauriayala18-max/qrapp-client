import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useSessionStore } from "@/stores/sessionStore";
import { useCartStore } from "@/stores/cartStore";
import { menuService } from "@/services/menu";
import { getErrorMessage } from "@/services/api";
import { StarRating } from "@/components/StarRating";
import { Skeleton } from "@/components/Skeleton";
import { Button } from "@/components/ui/Button";
import {
  CartItem,
  CartModification,
  MenuProduct,
  ModificationGroup,
} from "@/types";
import { formatGs, formatPrepTime } from "@/utils/format";

export default function ProductDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { productId } = useLocalSearchParams<{ productId: string }>();

  const menu = useSessionStore((s) => s.menu);
  const session = useSessionStore((s) => s.session);
  const addItem = useCartStore((s) => s.addItem);
  const ensureSession = useCartStore((s) => s.ensureSession);

  const cached = menu?.products.find((p) => p.id === productId) ?? null;

  const [product, setProduct] = useState<MenuProduct | null>(cached);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let active = true;
    if (!productId) return;
    setLoading(!cached);
    menuService
      .getProduct(productId)
      .then((p) => {
        if (active) {
          setProduct(p);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (active) {
          if (!cached) setError(getErrorMessage(e));
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [productId]);

  const toggleOption = (group: ModificationGroup, optionId: string) => {
    setSelections((prev) => {
      const current = prev[group.id] ?? [];
      if (group.max_selections <= 1) {
        return { ...prev, [group.id]: [optionId] };
      }
      if (current.includes(optionId)) {
        return { ...prev, [group.id]: current.filter((id) => id !== optionId) };
      }
      if (current.length >= group.max_selections) return prev;
      return { ...prev, [group.id]: [...current, optionId] };
    });
  };

  const { modifications, modsTotal, missingRequired } = useMemo(() => {
    const mods: CartModification[] = [];
    let total = 0;
    let missing = false;
    for (const group of product?.modification_groups ?? []) {
      const chosen = selections[group.id] ?? [];
      const minRequired = group.required
        ? Math.max(group.min_selections ?? 1, 1)
        : group.min_selections ?? 0;
      if (chosen.length < minRequired) missing = true;
      for (const optId of chosen) {
        const opt = group.options.find((o) => o.id === optId);
        if (opt) {
          mods.push({
            group_id: group.id,
            group_name: group.name,
            option_id: opt.id,
            option_name: opt.name,
            price: opt.price,
          });
          total += opt.price;
        }
      }
    }
    return { modifications: mods, modsTotal: total, missingRequired: missing };
  }, [product?.modification_groups, selections]);

  const unitPrice = (product?.price ?? 0) + modsTotal;
  const totalPrice = unitPrice * quantity;

  const handleAdd = () => {
    if (!product || !product.available || missingRequired) return;
    if (session) ensureSession(session.id);
    const item: CartItem = {
      id: `${product.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      product,
      quantity,
      modifications,
      notes: notes.trim() || undefined,
      totalPrice,
    };
    addItem(item);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAdded(true);
    setTimeout(() => {
      if (router.canGoBack()) router.back();
    }, 600);
  };

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Pressable
        onPress={goBack}
        style={[styles.floatingBack, { top: insets.top + 12 }]}
        hitSlop={10}
      >
        <Feather name="arrow-left" size={22} color="#FFFFFF" />
      </Pressable>

      {loading ? (
        <View style={styles.loadingBody}>
          <Skeleton width="100%" height={260} radius={0} />
          <View style={styles.loadingContent}>
            <Skeleton width="70%" height={24} />
            <Skeleton width="100%" height={14} />
            <Skeleton width="90%" height={14} />
            <Skeleton width="40%" height={20} />
          </View>
        </View>
      ) : error || !product ? (
        <View style={styles.center}>
          <Feather name="alert-circle" size={44} color={colors.border} />
          <Text style={[styles.errTitle, { color: colors.foreground }]}>
            No pudimos cargar el producto
          </Text>
          <Button title="Volver" onPress={goBack} />
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{ paddingBottom: 140 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.imageWrap}>
              {product.image ? (
                <Image source={{ uri: product.image }} style={styles.image} />
              ) : (
                <View style={[styles.image, styles.imagePlaceholder, { backgroundColor: colors.primary + "18" }]}>
                  <Feather name="coffee" size={56} color={colors.primary} />
                </View>
              )}
              {!product.available ? (
                <View style={styles.unavailablePill}>
                  <Text style={styles.unavailablePillText}>No disponible</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.body}>
              <Text style={[styles.name, { color: colors.foreground }]}>
                {product.name}
              </Text>

              <View style={styles.metaRow}>
                {product.rating != null ? (
                  <Pressable
                    style={styles.ratingLink}
                    onPress={() => router.push(`/reviews/${product.id}`)}
                  >
                    <StarRating
                      rating={product.rating}
                      reviewsCount={product.reviews_count}
                      size={14}
                    />
                    <Text style={[styles.reviewsLink, { color: colors.primary }]}>
                      ver reseñas
                    </Text>
                  </Pressable>
                ) : null}
                {formatPrepTime(product.prep_time_minutes) ? (
                  <View style={styles.prep}>
                    <Feather name="clock" size={13} color={colors.mutedForeground} />
                    <Text style={[styles.prepText, { color: colors.mutedForeground }]}>
                      {formatPrepTime(product.prep_time_minutes)}
                    </Text>
                  </View>
                ) : null}
              </View>

              {product.description ? (
                <Text style={[styles.description, { color: colors.mutedForeground }]}>
                  {product.description}
                </Text>
              ) : null}

              {(product.ingredients?.length || product.keywords?.length) ? (
                <View style={styles.tags}>
                  {[...(product.ingredients ?? []), ...(product.keywords ?? [])].map(
                    (tag, i) => (
                      <View
                        key={`${tag}-${i}`}
                        style={[styles.tag, { backgroundColor: colors.muted }]}
                      >
                        <Text style={[styles.tagText, { color: colors.mutedForeground }]}>
                          {tag}
                        </Text>
                      </View>
                    ),
                  )}
                </View>
              ) : null}

              {(product.modification_groups ?? []).map((group) => {
                const chosen = selections[group.id] ?? [];
                const multi = group.max_selections > 1;
                return (
                  <View key={group.id} style={styles.group}>
                    <View style={styles.groupHeader}>
                      <Text style={[styles.groupTitle, { color: colors.foreground }]}>
                        {group.name}
                      </Text>
                      {group.required ? (
                        <Text style={[styles.required, { color: colors.primary }]}>
                          (obligatorio)
                        </Text>
                      ) : (
                        <Text style={[styles.optional, { color: colors.mutedForeground }]}>
                          {multi ? `hasta ${group.max_selections}` : "opcional"}
                        </Text>
                      )}
                    </View>
                    {group.options.map((opt) => {
                      const selected = chosen.includes(opt.id);
                      const disabled = opt.available === false;
                      return (
                        <Pressable
                          key={opt.id}
                          onPress={() => !disabled && toggleOption(group, opt.id)}
                          disabled={disabled}
                          style={[
                            styles.option,
                            { borderColor: selected ? colors.primary : colors.border, opacity: disabled ? 0.4 : 1 },
                          ]}
                        >
                          <View
                            style={[
                              multi ? styles.checkbox : styles.radio,
                              {
                                borderColor: selected ? colors.primary : colors.border,
                                backgroundColor: selected ? colors.primary : "transparent",
                              },
                            ]}
                          >
                            {selected ? (
                              <Feather name="check" size={12} color="#FFFFFF" />
                            ) : null}
                          </View>
                          <Text style={[styles.optionName, { color: colors.foreground }]}>
                            {opt.name}
                          </Text>
                          {opt.price > 0 ? (
                            <Text style={[styles.optionPrice, { color: colors.mutedForeground }]}>
                              +{formatGs(opt.price)}
                            </Text>
                          ) : null}
                        </Pressable>
                      );
                    })}
                  </View>
                );
              })}

              <View style={styles.group}>
                <Text style={[styles.groupTitle, { color: colors.foreground }]}>
                  ¿Alguna observación?
                </Text>
                <TextInput
                  style={[
                    styles.notesInput,
                    { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted },
                  ]}
                  placeholder="Ej: sin cebolla, punto de cocción..."
                  placeholderTextColor={colors.mutedForeground}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                />
              </View>

              <View style={styles.qtyRow}>
                <Text style={[styles.groupTitle, { color: colors.foreground }]}>
                  Cantidad
                </Text>
                <View style={styles.qtyControl}>
                  <Pressable
                    onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                    style={[styles.qtyBtn, { borderColor: colors.border }]}
                  >
                    <Feather name="minus" size={18} color={colors.foreground} />
                  </Pressable>
                  <Text style={[styles.qtyValue, { color: colors.foreground }]}>
                    {quantity}
                  </Text>
                  <Pressable
                    onPress={() => setQuantity((q) => q + 1)}
                    style={[styles.qtyBtn, { borderColor: colors.border }]}
                  >
                    <Feather name="plus" size={18} color={colors.foreground} />
                  </Pressable>
                </View>
              </View>
            </View>
          </ScrollView>

          <View
            style={[
              styles.footer,
              {
                backgroundColor: colors.background,
                borderTopColor: colors.border,
                paddingBottom: insets.bottom + 14,
              },
            ]}
          >
            {missingRequired ? (
              <Text style={[styles.requiredHint, { color: colors.destructive }]}>
                Seleccioná las opciones obligatorias
              </Text>
            ) : null}
            <Pressable
              onPress={handleAdd}
              disabled={!product.available || missingRequired || added}
              style={({ pressed }) => [
                styles.addButton,
                {
                  backgroundColor: product.available ? colors.primary : colors.muted,
                  opacity: (!product.available || missingRequired) ? 0.5 : pressed ? 0.9 : 1,
                },
              ]}
            >
              {added ? (
                <>
                  <Feather name="check" size={18} color="#FFFFFF" />
                  <Text style={styles.addButtonText}>Agregado</Text>
                </>
              ) : (
                <>
                  <Text style={styles.addButtonText}>
                    {product.available ? "Agregar al pedido" : "No disponible"}
                  </Text>
                  {product.available ? (
                    <Text style={styles.addButtonPrice}>{formatGs(totalPrice)}</Text>
                  ) : null}
                </>
              )}
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    padding: 24,
  },
  errTitle: { fontSize: 18, fontWeight: "700" },
  floatingBack: {
    position: "absolute",
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingBody: { flex: 1 },
  loadingContent: { padding: 20, gap: 12 },
  imageWrap: { position: "relative" },
  image: { width: "100%", height: 280 },
  imagePlaceholder: { alignItems: "center", justifyContent: "center" },
  unavailablePill: {
    position: "absolute",
    bottom: 16,
    left: 20,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  unavailablePillText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  body: { padding: 20, gap: 16 },
  name: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  ratingLink: { flexDirection: "row", alignItems: "center", gap: 8 },
  reviewsLink: { fontSize: 13, fontWeight: "600" },
  prep: { flexDirection: "row", alignItems: "center", gap: 4 },
  prepText: { fontSize: 13, fontWeight: "500" },
  description: { fontSize: 15, lineHeight: 22 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  tagText: { fontSize: 12, fontWeight: "500" },
  group: { gap: 10, marginTop: 4 },
  groupHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  groupTitle: { fontSize: 16, fontWeight: "700", letterSpacing: -0.2 },
  required: { fontSize: 13, fontWeight: "600" },
  optional: { fontSize: 13 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  optionName: { flex: 1, fontSize: 15, fontWeight: "500" },
  optionPrice: { fontSize: 14, fontWeight: "600" },
  notesInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 70,
    textAlignVertical: "top",
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  qtyControl: { flexDirection: "row", alignItems: "center", gap: 18 },
  qtyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyValue: { fontSize: 18, fontWeight: "700", minWidth: 24, textAlign: "center" },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 8,
  },
  requiredHint: { fontSize: 13, fontWeight: "500", textAlign: "center" },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  addButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  addButtonPrice: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    opacity: 0.95,
  },
});
