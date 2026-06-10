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
import { Swipeable } from "react-native-gesture-handler";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useCartStore } from "@/stores/cartStore";
import { useSessionStore } from "@/stores/sessionStore";
import { orderService } from "@/services/orders";
import { getErrorMessage } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { formatGs } from "@/utils/format";
import { CartItem } from "@/types";

export default function CartScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.getTotal());
  const count = useCartStore((s) => s.getCount());
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);

  const session = useSessionStore((s) => s.session);
  const addOrder = useSessionStore((s) => s.addOrder);

  const [generalNotes, setGeneralNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  };

  const goToMenu = () => {
    if (session) router.replace(`/session/${session.id}`);
    else router.replace("/(tabs)");
  };

  const confirmOrder = async () => {
    if (items.length === 0 || submitting) return;
    if (!session) {
      setError("No estás en una mesa activa. Escaneá el QR de tu mesa.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const order = await orderService.createOrder(
        session.id,
        items,
        generalNotes.trim() || undefined,
      );
      addOrder(order);
      clearCart();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/order/${order.id}`);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const renderDeleteAction = (itemId: string) => (
    <Pressable
      onPress={() => removeItem(itemId)}
      style={[styles.deleteAction, { backgroundColor: colors.destructive }]}
    >
      <Feather name="trash-2" size={22} color="#FFFFFF" />
    </Pressable>
  );

  const renderItem = (item: CartItem) => (
    <Swipeable
      key={item.id}
      renderRightActions={() => renderDeleteAction(item.id)}
      overshootRight={false}
    >
      <View style={[styles.item, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
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
    </Swipeable>
  );

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
          <Button title="Ver menú" onPress={goToMenu} style={{ marginTop: 8 }} />
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {items.map(renderItem)}

            <View style={styles.notesWrap}>
              <Text style={[styles.notesLabel, { color: colors.foreground }]}>
                Observaciones generales
              </Text>
              <TextInput
                style={[
                  styles.notesInput,
                  { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted },
                ]}
                placeholder="Ej: traer todo junto, sin picante..."
                placeholderTextColor={colors.mutedForeground}
                value={generalNotes}
                onChangeText={setGeneralNotes}
                multiline
              />
            </View>

            <View style={[styles.summary, { borderColor: colors.border }]}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                  {count} ítem{count !== 1 ? "s" : ""}
                </Text>
                <Text style={[styles.summaryValue, { color: colors.foreground }]}>
                  {formatGs(subtotal)}
                </Text>
              </View>
            </View>

            {error ? (
              <Text style={[styles.errorText, { color: colors.destructive }]}>
                {error}
              </Text>
            ) : null}
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
                {formatGs(subtotal)}
              </Text>
            </View>
            <Button
              title={submitting ? "Confirmando..." : "Confirmar pedido"}
              fullWidth
              size="lg"
              loading={submitting}
              onPress={confirmOrder}
            />
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
  list: { padding: 16, paddingBottom: 24 },
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
  deleteAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 72,
  },
  notesWrap: { marginTop: 20, gap: 8 },
  notesLabel: { fontSize: 15, fontWeight: "700" },
  notesInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 70,
    textAlignVertical: "top",
  },
  summary: {
    marginTop: 20,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryLabel: { fontSize: 15 },
  summaryValue: { fontSize: 15, fontWeight: "700" },
  errorText: { fontSize: 13, marginTop: 14, textAlign: "center" },
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
