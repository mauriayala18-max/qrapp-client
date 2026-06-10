import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useCartStore } from "@/stores/cartStore";
import { Button } from "@/components/ui/Button";
import { formatGs } from "@/utils/format";

export default function CartScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.getTotal());
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 12, borderBottomColor: colors.border },
        ]}
      >
        <Pressable onPress={goBack} hitSlop={10} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Tu pedido</Text>
        <View style={{ width: 40 }} />
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="shopping-bag" size={48} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Tu pedido está vacío
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
            Agregá productos del menú para empezar
          </Text>
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          >
            {items.map((item) => (
              <View
                key={item.id}
                style={[styles.item, { borderBottomColor: colors.border }]}
              >
                <View style={styles.itemTop}>
                  <Text style={[styles.itemName, { color: colors.foreground }]}>
                    {item.product.name}
                  </Text>
                  <Pressable onPress={() => removeItem(item.id)} hitSlop={8}>
                    <Feather name="trash-2" size={18} color={colors.mutedForeground} />
                  </Pressable>
                </View>
                {item.modifications.length > 0 ? (
                  <Text style={[styles.itemMods, { color: colors.mutedForeground }]}>
                    {item.modifications.map((m) => m.option_name).join(", ")}
                  </Text>
                ) : null}
                {item.notes ? (
                  <Text style={[styles.itemNotes, { color: colors.mutedForeground }]}>
                    "{item.notes}"
                  </Text>
                ) : null}
                <View style={styles.itemBottom}>
                  <View style={styles.qtyControl}>
                    <Pressable
                      onPress={() => updateQuantity(item.id, item.quantity - 1)}
                      style={[styles.qtyBtn, { borderColor: colors.border }]}
                    >
                      <Feather name="minus" size={16} color={colors.foreground} />
                    </Pressable>
                    <Text style={[styles.qtyValue, { color: colors.foreground }]}>
                      {item.quantity}
                    </Text>
                    <Pressable
                      onPress={() => updateQuantity(item.id, item.quantity + 1)}
                      style={[styles.qtyBtn, { borderColor: colors.border }]}
                    >
                      <Feather name="plus" size={16} color={colors.foreground} />
                    </Pressable>
                  </View>
                  <Text style={[styles.itemPrice, { color: colors.primary }]}>
                    {formatGs(item.totalPrice)}
                  </Text>
                </View>
              </View>
            ))}
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
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>
                Total
              </Text>
              <Text style={[styles.totalValue, { color: colors.foreground }]}>
                {formatGs(total)}
              </Text>
            </View>
            <Button title="Confirmar pedido (próximamente)" fullWidth disabled />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  title: { fontSize: 17, fontWeight: "700" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyDesc: { fontSize: 14, textAlign: "center" },
  list: { padding: 16 },
  item: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 8,
  },
  itemTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemName: { fontSize: 16, fontWeight: "700", flex: 1 },
  itemMods: { fontSize: 13 },
  itemNotes: { fontSize: 13, fontStyle: "italic" },
  itemBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  qtyControl: { flexDirection: "row", alignItems: "center", gap: 14 },
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyValue: { fontSize: 16, fontWeight: "700", minWidth: 20, textAlign: "center" },
  itemPrice: { fontSize: 16, fontWeight: "800" },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 14,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalLabel: { fontSize: 15, fontWeight: "500" },
  totalValue: { fontSize: 22, fontWeight: "800" },
});
