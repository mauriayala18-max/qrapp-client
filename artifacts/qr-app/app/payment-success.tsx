import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useSessionStore } from "@/stores/sessionStore";
import { Button } from "@/components/ui/Button";
import { formatGs } from "@/utils/format";
import { PaymentMethod } from "@/types";

const METHOD_LABELS: Record<string, string> = {
  card: "Tarjeta",
  apple_pay: "Apple Pay",
  google_pay: "Google Pay",
  cash: "Efectivo",
  pos: "POS",
};

export default function PaymentSuccessScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const session = useSessionStore((s) => s.session);
  const params = useLocalSearchParams<{
    amount?: string;
    receipt?: string;
    tip?: string;
    discount?: string;
    method?: string;
    sessionPaid?: string;
  }>();

  const amount = parseInt(params.amount ?? "0", 10) || 0;
  const tip = parseInt(params.tip ?? "0", 10) || 0;
  const discount = parseInt(params.discount ?? "0", 10) || 0;
  const receipt = params.receipt || "";
  const method = (params.method as PaymentMethod) || undefined;
  const sessionPaid = params.sessionPaid === "1";

  const [showReceipt, setShowReceipt] = useState(false);
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  const finish = () => {
    if (sessionPaid) {
      router.replace("/(tabs)");
    } else if (session) {
      router.replace(`/session/${session.id}`);
    } else {
      router.replace("/(tabs)");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.checkCircle,
            { backgroundColor: colors.success + "1A", transform: [{ scale }] },
          ]}
        >
          <Feather name="check" size={52} color={colors.success} />
        </Animated.View>

        <Text style={[styles.title, { color: colors.foreground }]}>
          ¡Pago confirmado!
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {sessionPaid
            ? "La cuenta de la mesa quedó saldada"
            : "Gracias por tu pago"}
        </Text>

        <Text style={[styles.amount, { color: colors.foreground }]}>
          {formatGs(amount)}
        </Text>

        <View style={[styles.card, { borderColor: colors.border }]}>
          {method ? (
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>
                Método
              </Text>
              <Text style={[styles.rowValue, { color: colors.foreground }]}>
                {METHOD_LABELS[method] ?? method}
              </Text>
            </View>
          ) : null}
          {discount > 0 ? (
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.success }]}>
                Descuento aplicado
              </Text>
              <Text style={[styles.rowValue, { color: colors.success }]}>
                -{formatGs(discount)}
              </Text>
            </View>
          ) : null}
          {tip > 0 ? (
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>
                Propina
              </Text>
              <Text style={[styles.rowValue, { color: colors.foreground }]}>
                {formatGs(tip)}
              </Text>
            </View>
          ) : null}
          {receipt ? (
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>
                Comprobante
              </Text>
              <Text style={[styles.rowValue, { color: colors.foreground }]}>
                {receipt}
              </Text>
            </View>
          ) : null}
        </View>

        {receipt ? (
          <Pressable onPress={() => setShowReceipt((v) => !v)} style={styles.link}>
            <Text style={[styles.linkText, { color: colors.primary }]}>
              {showReceipt ? "Ocultar recibo" : "Ver recibo"}
            </Text>
          </Pressable>
        ) : null}

        {showReceipt ? (
          <View style={[styles.receiptCard, { backgroundColor: colors.muted }]}>
            <Text style={[styles.receiptTitle, { color: colors.foreground }]}>
              Recibo {receipt}
            </Text>
            <View style={[styles.receiptDivider, { borderColor: colors.border }]} />
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>
                Monto pagado
              </Text>
              <Text style={[styles.rowValue, { color: colors.foreground }]}>
                {formatGs(amount)}
              </Text>
            </View>
            {session ? (
              <View style={styles.row}>
                <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>
                  Mesa
                </Text>
                <Text style={[styles.rowValue, { color: colors.foreground }]}>
                  {session.table?.number ?? "—"}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + 14, backgroundColor: colors.background },
        ]}
      >
        <Button
          title={sessionPaid ? "Finalizar" : "Volver a la mesa"}
          fullWidth
          size="lg"
          onPress={finish}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 24, alignItems: "center" },
  checkCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  title: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { fontSize: 15, marginTop: 8, textAlign: "center" },
  amount: { fontSize: 38, fontWeight: "800", marginTop: 24, letterSpacing: -1 },
  card: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    marginTop: 28,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  rowLabel: { fontSize: 14 },
  rowValue: { fontSize: 14, fontWeight: "700" },
  link: { paddingVertical: 14 },
  linkText: { fontSize: 15, fontWeight: "600" },
  receiptCard: {
    width: "100%",
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  receiptTitle: { fontSize: 15, fontWeight: "700" },
  receiptDivider: { borderTopWidth: 1 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
});
