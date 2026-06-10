import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useSessionStore } from "@/stores/sessionStore";
import { orderService } from "@/services/orders";
import { paymentService } from "@/services/payments";
import { getErrorMessage } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { formatGs } from "@/utils/format";
import {
  BankingBenefit,
  Order,
  Payment,
  PaymentMethod,
  Session,
} from "@/types";

export interface BillTabHandle {
  refresh: () => Promise<void>;
}

interface Props {
  session: Session;
  onPaid: (payment: Payment) => void;
  onOpenSplit: () => void;
}

const TIP_OPTIONS = [5, 10, 15];

const METHOD_META: Record<
  PaymentMethod,
  { label: string; icon: keyof typeof Feather.glyphMap; note?: string }
> = {
  card: { label: "Tarjeta", icon: "credit-card" },
  apple_pay: { label: "Apple Pay", icon: "smartphone" },
  google_pay: { label: "Google Pay", icon: "smartphone" },
  cash: { label: "Efectivo", icon: "dollar-sign", note: "Un mozo procesará tu pago" },
  pos: { label: "POS", icon: "printer", note: "Un mozo traerá el POS" },
};

function resolveMethods(branchMethods?: string[]): PaymentMethod[] {
  if (branchMethods && branchMethods.length > 0) {
    return branchMethods.filter(
      (m): m is PaymentMethod => m in METHOD_META,
    );
  }
  const defaults: PaymentMethod[] = ["card"];
  if (Platform.OS === "ios") defaults.push("apple_pay");
  if (Platform.OS === "android") defaults.push("google_pay");
  defaults.push("cash", "pos");
  return defaults;
}

function benefitDiscount(b: BankingBenefit, subtotal: number): number {
  if (b.discount_amount) return b.discount_amount;
  if (b.discount_percentage) return Math.round((subtotal * b.discount_percentage) / 100);
  return 0;
}

export const BillTab = forwardRef<BillTabHandle, Props>(
  ({ session, onPaid, onOpenSplit }, ref) => {
    const colors = useColors();
    const storeOrders = useSessionStore((s) => s.orders);

    const [orders, setOrders] = useState<Order[]>(storeOrders);
    const [benefits, setBenefits] = useState<BankingBenefit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [tipPercent, setTipPercent] = useState<number | null>(10);
    const [customTip, setCustomTip] = useState("");
    const [tipMode, setTipMode] = useState<"percent" | "custom">("percent");
    const [method, setMethod] = useState<PaymentMethod | null>(null);
    const [benefitId, setBenefitId] = useState<string | null>(null);
    const [paying, setPaying] = useState(false);

    const branchId = session.branch?.id;

    const load = useCallback(async () => {
      try {
        const [ordersData, benefitsData] = await Promise.all([
          orderService.getSessionOrders(session.id),
          branchId
            ? paymentService.getBankingBenefits(branchId).catch(() => [])
            : Promise.resolve([]),
        ]);
        setOrders(ordersData.length ? ordersData : storeOrders);
        setBenefits(benefitsData);
        setError(null);
      } catch (e) {
        setOrders((prev) => (prev.length ? prev : storeOrders));
        if (storeOrders.length === 0) setError(getErrorMessage(e));
      } finally {
        setLoading(false);
      }
    }, [session.id, branchId, storeOrders]);

    useImperativeHandle(ref, () => ({ refresh: load }), [load]);

    useEffect(() => {
      setLoading(true);
      load();
    }, [load]);

    const methods = useMemo(
      () => resolveMethods(session.branch?.payment_methods),
      [session.branch?.payment_methods],
    );

    const billable = orders.filter((o) => o.status !== "cancelled");
    const subtotal = billable.reduce((acc, o) => acc + (o.total ?? 0), 0);

    const tip = useMemo(() => {
      if (tipMode === "custom") return Math.max(0, parseInt(customTip, 10) || 0);
      return tipPercent ? Math.round((subtotal * tipPercent) / 100) : 0;
    }, [tipMode, customTip, tipPercent, subtotal]);

    const selectedBenefit = benefits.find((b) => b.id === benefitId) ?? null;
    const discount = selectedBenefit ? benefitDiscount(selectedBenefit, subtotal) : 0;
    const total = Math.max(0, subtotal - discount + tip);

    const handlePay = async () => {
      if (!method || paying || subtotal === 0) return;
      setPaying(true);
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const payment = await paymentService.createPayment({
          session_id: session.id,
          amount: total,
          method,
          tip,
          benefit_id: benefitId ?? undefined,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onPaid(payment);
      } catch (e) {
        setError(getErrorMessage(e));
      } finally {
        setPaying(false);
      }
    };

    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      );
    }

    if (subtotal === 0) {
      return (
        <View style={styles.empty}>
          <Feather name="file-text" size={44} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Tu cuenta está vacía
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
            {error ?? "Hacé tu primer pedido para ver el resumen de la cuenta"}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.wrap}>
        {/* Bill summary */}
        <View style={[styles.card, { borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            Resumen
          </Text>
          {billable.map((o) =>
            o.items.map((it, idx) => (
              <View key={`${o.id}-${idx}`} style={styles.lineRow}>
                <Text style={[styles.lineName, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {it.quantity}× {it.product?.name ?? "Producto"}
                </Text>
                <Text style={[styles.linePrice, { color: colors.foreground }]}>
                  {formatGs((it.unit_price ?? 0) * it.quantity)}
                </Text>
              </View>
            )),
          )}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.lineRow}>
            <Text style={[styles.subtotalLabel, { color: colors.mutedForeground }]}>
              Subtotal
            </Text>
            <Text style={[styles.subtotalValue, { color: colors.foreground }]}>
              {formatGs(subtotal)}
            </Text>
          </View>
        </View>

        {/* Tip */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Propina</Text>
        <View style={styles.chipRow}>
          {TIP_OPTIONS.map((p) => {
            const active = tipMode === "percent" && tipPercent === p;
            return (
              <Pressable
                key={p}
                onPress={() => {
                  setTipMode("percent");
                  setTipPercent(p);
                }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? colors.primary : colors.muted,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: active ? colors.primaryForeground : colors.foreground },
                  ]}
                >
                  {p}%
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => {
              setTipMode("percent");
              setTipPercent(null);
            }}
            style={[
              styles.chip,
              {
                backgroundColor:
                  tipMode === "percent" && tipPercent === null ? colors.primary : colors.muted,
                borderColor:
                  tipMode === "percent" && tipPercent === null ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                {
                  color:
                    tipMode === "percent" && tipPercent === null
                      ? colors.primaryForeground
                      : colors.foreground,
                },
              ]}
            >
              Sin propina
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setTipMode("custom")}
            style={[
              styles.chip,
              {
                backgroundColor: tipMode === "custom" ? colors.primary : colors.muted,
                borderColor: tipMode === "custom" ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                { color: tipMode === "custom" ? colors.primaryForeground : colors.foreground },
              ]}
            >
              Otro monto
            </Text>
          </Pressable>
        </View>
        {tipMode === "custom" ? (
          <TextInput
            style={[
              styles.tipInput,
              { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted },
            ]}
            placeholder="Monto de propina (Gs.)"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="number-pad"
            value={customTip}
            onChangeText={setCustomTip}
          />
        ) : null}

        {/* Payment method */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Método de pago
        </Text>
        <View style={styles.methodList}>
          {methods.map((m) => {
            const meta = METHOD_META[m];
            const active = method === m;
            return (
              <Pressable
                key={m}
                onPress={() => setMethod(m)}
                style={[
                  styles.methodRow,
                  {
                    borderColor: active ? colors.primary : colors.border,
                    backgroundColor: active ? colors.primary + "0D" : colors.background,
                  },
                ]}
              >
                <Feather
                  name={meta.icon}
                  size={20}
                  color={active ? colors.primary : colors.mutedForeground}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.methodLabel, { color: colors.foreground }]}>
                    {meta.label}
                  </Text>
                  {meta.note ? (
                    <Text style={[styles.methodNote, { color: colors.mutedForeground }]}>
                      {meta.note}
                    </Text>
                  ) : null}
                </View>
                <View
                  style={[
                    styles.radio,
                    { borderColor: active ? colors.primary : colors.border },
                  ]}
                >
                  {active ? (
                    <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Banking benefits */}
        {benefits.length > 0 ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Beneficios bancarios
            </Text>
            <View style={styles.methodList}>
              {benefits.map((b) => {
                const active = benefitId === b.id;
                const d = benefitDiscount(b, subtotal);
                return (
                  <Pressable
                    key={b.id}
                    onPress={() => setBenefitId(active ? null : b.id)}
                    style={[
                      styles.methodRow,
                      {
                        borderColor: active ? colors.success : colors.border,
                        backgroundColor: active ? colors.success + "0D" : colors.background,
                      },
                    ]}
                  >
                    <Feather
                      name="gift"
                      size={20}
                      color={active ? colors.success : colors.mutedForeground}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.methodLabel, { color: colors.foreground }]}>
                        {b.bank_name}
                        {b.card_label ? ` · ${b.card_label}` : ""}
                      </Text>
                      <Text style={[styles.methodNote, { color: colors.success }]}>
                        {b.description ?? `Ahorrás ${formatGs(d)}`}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.radio,
                        { borderColor: active ? colors.success : colors.border },
                      ]}
                    >
                      {active ? (
                        <View style={[styles.radioDot, { backgroundColor: colors.success }]} />
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

        {/* Totals */}
        <View style={[styles.card, { borderColor: colors.border, marginTop: 8 }]}>
          <View style={styles.lineRow}>
            <Text style={[styles.lineName, { color: colors.mutedForeground }]}>Subtotal</Text>
            <Text style={[styles.linePrice, { color: colors.foreground }]}>
              {formatGs(subtotal)}
            </Text>
          </View>
          {discount > 0 ? (
            <View style={styles.lineRow}>
              <Text style={[styles.lineName, { color: colors.success }]}>Descuento</Text>
              <Text style={[styles.linePrice, { color: colors.success }]}>
                -{formatGs(discount)}
              </Text>
            </View>
          ) : null}
          {tip > 0 ? (
            <View style={styles.lineRow}>
              <Text style={[styles.lineName, { color: colors.mutedForeground }]}>Propina</Text>
              <Text style={[styles.linePrice, { color: colors.foreground }]}>
                {formatGs(tip)}
              </Text>
            </View>
          ) : null}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.lineRow}>
            <Text style={[styles.totalLabel, { color: colors.foreground }]}>Total a pagar</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>
              {formatGs(total)}
            </Text>
          </View>
        </View>

        {error ? (
          <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
        ) : null}

        <Button
          title="Dividir cuenta"
          variant="outline"
          fullWidth
          onPress={onOpenSplit}
          style={{ marginTop: 12 }}
        />
        <Button
          title={paying ? "Procesando..." : `Pagar ${formatGs(total)}`}
          fullWidth
          size="lg"
          loading={paying}
          disabled={!method}
          onPress={handlePay}
          style={{ marginTop: 10 }}
        />
        {!method ? (
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            Elegí un método de pago para continuar
          </Text>
        ) : null}
      </View>
    );
  },
);

BillTab.displayName = "BillTab";

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  center: { paddingVertical: 60, alignItems: "center" },
  empty: { alignItems: "center", paddingVertical: 70, gap: 12 },
  emptyTitle: { fontSize: 17, fontWeight: "700" },
  emptyDesc: {
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 19,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  lineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  lineName: { fontSize: 14, flex: 1 },
  linePrice: { fontSize: 14, fontWeight: "600" },
  divider: { height: 1, marginVertical: 2 },
  subtotalLabel: { fontSize: 15, fontWeight: "600" },
  subtotalValue: { fontSize: 15, fontWeight: "700" },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginTop: 10 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  chipText: { fontSize: 14, fontWeight: "600" },
  tipInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    marginTop: 4,
  },
  methodList: { gap: 10 },
  methodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  methodLabel: { fontSize: 15, fontWeight: "600" },
  methodNote: { fontSize: 12, marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: { width: 11, height: 11, borderRadius: 6 },
  totalLabel: { fontSize: 16, fontWeight: "700" },
  totalValue: { fontSize: 22, fontWeight: "800" },
  errorText: { fontSize: 13, marginTop: 8, textAlign: "center" },
  hint: { fontSize: 12, textAlign: "center", marginTop: 8 },
});
