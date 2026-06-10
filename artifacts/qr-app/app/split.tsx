import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useSessionStore } from "@/stores/sessionStore";
import { useAuthStore } from "@/stores/authStore";
import { orderService } from "@/services/orders";
import { paymentService } from "@/services/payments";
import { getErrorMessage } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/Toast";
import { formatGs } from "@/utils/format";
import { Order, Split, SplitItem } from "@/types";

type Mode = "equal" | "items" | "custom" | null;

interface FlatItem {
  key: string;
  name: string;
  price: number;
}

export default function SplitScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const session = useSessionStore((s) => s.session);
  const storeOrders = useSessionStore((s) => s.orders);
  const user = useAuthStore((s) => s.user);

  const [orders, setOrders] = useState<Order[]>(storeOrders);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [mode, setMode] = useState<Mode>(null);
  const [people, setPeople] = useState(2);
  const [claimed, setClaimed] = useState<Record<string, boolean>>({});
  const [customAmount, setCustomAmount] = useState("");
  const [paying, setPaying] = useState(false);

  // Backend-backed split for "items" mode. `splitId` is set only when the
  // server created a real split, so we can claim canonical item ids. When the
  // backend is unreachable we fall back to local items (estimate only).
  const [splitId, setSplitId] = useState<string | null>(null);
  const [backendItems, setBackendItems] = useState<SplitItem[] | null>(null);
  const [itemsLoading, setItemsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!session) {
      setLoading(false);
      return;
    }
    try {
      const data = await orderService.getSessionOrders(session.id);
      setOrders(data.length ? data : storeOrders);
      setError(null);
    } catch (e) {
      setOrders((prev) => (prev.length ? prev : storeOrders));
      if (storeOrders.length === 0) setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [session, storeOrders]);

  useEffect(() => {
    load();
  }, [load]);

  const billable = orders.filter((o) => o.status !== "cancelled");
  const subtotal = billable.reduce((acc, o) => acc + (o.total ?? 0), 0);

  const localItems: FlatItem[] = useMemo(
    () =>
      billable.flatMap((o) =>
        o.items.map((it, idx) => ({
          key: `${o.id}-${idx}`,
          name: `${it.quantity}× ${it.product?.name ?? "Producto"}`,
          price: (it.unit_price ?? 0) * it.quantity,
        })),
      ),
    [billable],
  );

  // When the server created a real split we render its canonical items (so we
  // can claim by their real ids); otherwise we estimate from local order data.
  const usingBackendItems = splitId !== null && backendItems !== null;
  const selectableItems: FlatItem[] = useMemo(() => {
    if (usingBackendItems) {
      return backendItems!.map((i) => ({
        key: i.id,
        name: `${i.quantity && i.quantity > 1 ? `${i.quantity}× ` : ""}${i.product_name}`,
        price: i.price,
      }));
    }
    return localItems;
  }, [usingBackendItems, backendItems, localItems]);

  // Lazily create the backend split the first time the user opens "items" mode.
  useEffect(() => {
    let active = true;
    if (mode !== "items" || !session || splitId !== null || backendItems !== null) {
      return;
    }
    setItemsLoading(true);
    (async () => {
      try {
        const split = await paymentService.createSplit(session.id, "items");
        let items = split.items;
        if (!items || items.length === 0) {
          const full = await paymentService.getSplit(split.id);
          items = full.items;
        }
        if (!active) return;
        setSplitId(split.id);
        setBackendItems(items ?? []);
      } catch {
        // Backend unreachable: keep splitId null so we fall back to local items.
        if (active) setBackendItems(null);
      } finally {
        if (active) setItemsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [mode, session, splitId, backendItems]);

  const myAmount = useMemo(() => {
    if (mode === "equal") return Math.ceil(subtotal / Math.max(people, 1));
    if (mode === "items")
      return selectableItems
        .filter((i) => claimed[i.key])
        .reduce((acc, i) => acc + i.price, 0);
    if (mode === "custom") return Math.max(0, parseInt(customAmount, 10) || 0);
    return 0;
  }, [mode, subtotal, people, selectableItems, claimed, customAmount]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const handlePay = async () => {
    if (!session || myAmount <= 0 || paying) return;
    setPaying(true);
    setError(null);
    try {
      let paymentSplitId: string | undefined;

      if (mode === "items") {
        // Only claim against a real server split. If claiming fails, surface
        // the error and stop — we must not charge with broken split state.
        if (usingBackendItems && splitId) {
          const claims = selectableItems
            .filter((i) => claimed[i.key])
            .map((i) => ({ item_id: i.key, participant_name: user?.full_name }));
          if (claims.length) {
            try {
              await paymentService.claimItems(splitId, claims);
              paymentSplitId = splitId;
            } catch (e) {
              setError(getErrorMessage(e));
              setPaying(false);
              return;
            }
          }
        }
      } else {
        // Equal / custom: split bookkeeping is informational; a failure here
        // should not block the payment itself.
        try {
          const split = await paymentService.createSplit(
            session.id,
            mode === "custom" ? "custom" : "equal",
            mode === "equal" ? people : undefined,
          );
          paymentSplitId = split.id;
        } catch {
          /* best-effort */
        }
      }

      const payment = await paymentService.createPayment({
        session_id: session.id,
        amount: myAmount,
        method: "card",
        split_id: paymentSplitId,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({
        pathname: "/payment-success",
        params: {
          amount: String(myAmount),
          receipt: payment.receipt_number ?? "",
          method: "card",
          sessionPaid: payment.session_paid ? "1" : "0",
        },
      });
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setPaying(false);
    }
  };

  const shareLink = async () => {
    if (!session || myAmount <= 0) return;
    try {
      const link = await paymentService.createPaymentLink(session.id, myAmount);
      await Share.share({
        message: `Pagá tu parte (${formatGs(myAmount)}) acá: ${link.url}`,
      });
    } catch (e) {
      showToast(getErrorMessage(e));
    }
  };

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else if (session) router.replace(`/session/${session.id}`);
    else router.replace("/(tabs)");
  };

  const MODES: { key: Exclude<Mode, null>; title: string; desc: string; icon: keyof typeof Feather.glyphMap }[] = [
    { key: "equal", title: "Partes iguales", desc: "Dividir el total entre todos", icon: "users" },
    { key: "items", title: "Yo elijo lo mío", desc: "Pagás solo lo que pediste", icon: "check-square" },
    { key: "custom", title: "Monto personalizado", desc: "Indicás cuánto querés pagar", icon: "edit-3" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Toast visible={!!toast} message={toast ?? ""} type="info" />
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 12, borderBottomColor: colors.border },
        ]}
      >
        <Pressable onPress={goBack} hitSlop={10} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Dividir cuenta</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : subtotal === 0 ? (
        <View style={styles.center}>
          <Feather name="file-text" size={44} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            No hay cuenta para dividir
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
            {error ?? "Hacé un pedido primero"}
          </Text>
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.totalCard, { backgroundColor: colors.muted }]}>
              <Text style={[styles.totalCardLabel, { color: colors.mutedForeground }]}>
                Total de la cuenta
              </Text>
              <Text style={[styles.totalCardValue, { color: colors.foreground }]}>
                {formatGs(subtotal)}
              </Text>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              ¿Cómo querés dividir?
            </Text>
            <View style={styles.modeList}>
              {MODES.map((m) => {
                const active = mode === m.key;
                return (
                  <Pressable
                    key={m.key}
                    onPress={() => setMode(m.key)}
                    style={[
                      styles.modeCard,
                      {
                        borderColor: active ? colors.primary : colors.border,
                        backgroundColor: active ? colors.primary + "0D" : colors.background,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.modeIcon,
                        { backgroundColor: active ? colors.primary : colors.muted },
                      ]}
                    >
                      <Feather
                        name={m.icon}
                        size={18}
                        color={active ? "#FFFFFF" : colors.mutedForeground}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modeTitle, { color: colors.foreground }]}>
                        {m.title}
                      </Text>
                      <Text style={[styles.modeDesc, { color: colors.mutedForeground }]}>
                        {m.desc}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {mode === "equal" ? (
              <View style={styles.configBlock}>
                <Text style={[styles.configLabel, { color: colors.foreground }]}>
                  ¿Entre cuántas personas?
                </Text>
                <View style={styles.stepper}>
                  <Pressable
                    onPress={() => setPeople((p) => Math.max(2, p - 1))}
                    style={[styles.stepBtn, { borderColor: colors.border }]}
                  >
                    <Feather name="minus" size={18} color={colors.foreground} />
                  </Pressable>
                  <Text style={[styles.stepValue, { color: colors.foreground }]}>{people}</Text>
                  <Pressable
                    onPress={() => setPeople((p) => p + 1)}
                    style={[styles.stepBtn, { borderColor: colors.border }]}
                  >
                    <Feather name="plus" size={18} color={colors.foreground} />
                  </Pressable>
                </View>
              </View>
            ) : null}

            {mode === "items" ? (
              <View style={styles.configBlock}>
                <Text style={[styles.configLabel, { color: colors.foreground }]}>
                  Elegí lo que vas a pagar
                </Text>
                {itemsLoading ? (
                  <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />
                ) : null}
                <View style={styles.itemList}>
                  {selectableItems.map((it) => {
                    const active = !!claimed[it.key];
                    return (
                      <Pressable
                        key={it.key}
                        onPress={() =>
                          setClaimed((c) => ({ ...c, [it.key]: !c[it.key] }))
                        }
                        style={[
                          styles.itemRow,
                          {
                            borderColor: active ? colors.primary : colors.border,
                            backgroundColor: active ? colors.primary + "0D" : colors.background,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            {
                              borderColor: active ? colors.primary : colors.border,
                              backgroundColor: active ? colors.primary : "transparent",
                            },
                          ]}
                        >
                          {active ? <Feather name="check" size={13} color="#FFFFFF" /> : null}
                        </View>
                        <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={1}>
                          {it.name}
                        </Text>
                        <Text style={[styles.itemPrice, { color: colors.foreground }]}>
                          {formatGs(it.price)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {mode === "custom" ? (
              <View style={styles.configBlock}>
                <Text style={[styles.configLabel, { color: colors.foreground }]}>
                  ¿Cuánto querés pagar?
                </Text>
                <TextInput
                  style={[
                    styles.amountInput,
                    { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted },
                  ]}
                  placeholder="Monto en Gs."
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="number-pad"
                  value={customAmount}
                  onChangeText={setCustomAmount}
                />
              </View>
            ) : null}

            {error ? (
              <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
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
            {mode ? (
              <View style={styles.myAmountRow}>
                <Text style={[styles.myAmountLabel, { color: colors.mutedForeground }]}>
                  Tu parte
                </Text>
                <Text style={[styles.myAmountValue, { color: colors.primary }]}>
                  {formatGs(myAmount)}
                </Text>
              </View>
            ) : null}
            <Button
              title="Compartir link de pago"
              variant="outline"
              fullWidth
              disabled={!mode || myAmount <= 0}
              onPress={shareLink}
            />
            <Button
              title={paying ? "Procesando..." : `Pagar mi parte`}
              fullWidth
              size="lg"
              loading={paying}
              disabled={!mode || myAmount <= 0}
              onPress={handlePay}
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
  backBtn: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  title: { fontSize: 17, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 32 },
  emptyTitle: { fontSize: 17, fontWeight: "700" },
  emptyDesc: { fontSize: 14, textAlign: "center" },
  content: { padding: 16, paddingBottom: 24 },
  totalCard: {
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
    gap: 4,
    marginBottom: 20,
  },
  totalCardLabel: { fontSize: 13, fontWeight: "500" },
  totalCardValue: { fontSize: 26, fontWeight: "800" },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  modeList: { gap: 10 },
  modeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
  },
  modeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  modeTitle: { fontSize: 15, fontWeight: "700" },
  modeDesc: { fontSize: 13, marginTop: 2 },
  configBlock: { marginTop: 24, gap: 12 },
  configLabel: { fontSize: 15, fontWeight: "700" },
  stepper: { flexDirection: "row", alignItems: "center", gap: 20, alignSelf: "center" },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  stepValue: { fontSize: 24, fontWeight: "800", minWidth: 36, textAlign: "center" },
  itemList: { gap: 10 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  itemName: { fontSize: 14, flex: 1, fontWeight: "500" },
  itemPrice: { fontSize: 14, fontWeight: "700" },
  amountInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    fontWeight: "700",
  },
  errorText: { fontSize: 13, marginTop: 16, textAlign: "center" },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 10,
  },
  myAmountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  myAmountLabel: { fontSize: 15, fontWeight: "500" },
  myAmountValue: { fontSize: 22, fontWeight: "800" },
});
