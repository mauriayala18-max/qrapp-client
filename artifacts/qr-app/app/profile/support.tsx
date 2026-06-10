import React, { useState } from "react";
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Constants from "expo-constants";
import { useColors } from "@/hooks/useColors";
import { ScreenHeader } from "@/components/ScreenHeader";

const SUPPORT_EMAIL = "soporte@qrapp.com";

const FAQS: { q: string; a: string }[] = [
  {
    q: "¿Cómo escaneo el QR de mi mesa?",
    a: "Desde la pantalla de inicio tocá el botón “Escanear QR” y apuntá la cámara al código que está en tu mesa. Se abrirá el menú del restaurante automáticamente.",
  },
  {
    q: "¿Cómo gano puntos?",
    a: "Ganás puntos al completar tu perfil, hacer pedidos, calificar restaurantes y escribir reseñas. Podés ver el detalle en la sección “Puntos y recompensas”.",
  },
  {
    q: "¿Puedo cancelar un pedido?",
    a: "Podés cancelar un pedido mientras siga en estado “Recibido”. Una vez que entra en preparación, ya no es posible cancelarlo desde la app.",
  },
  {
    q: "¿Cómo hago una reserva?",
    a: "Entrá a Perfil → Reservas → “Nueva reserva”, elegí el restaurante, la fecha, el horario y la cantidad de personas.",
  },
  {
    q: "¿Cómo divido la cuenta con mis amigos?",
    a: "Al momento de pagar vas a poder dividir la cuenta en partes iguales, por ítem o de forma personalizada.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const colors = useColors();
  const [open, setOpen] = useState(false);

  return (
    <Pressable
      style={[styles.faqItem, { borderBottomColor: colors.border }]}
      onPress={() => {
        Haptics.selectionAsync();
        setOpen((v) => !v);
      }}
    >
      <View style={styles.faqHeader}>
        <Text style={[styles.faqQ, { color: colors.foreground }]}>{q}</Text>
        <Feather
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.mutedForeground}
        />
      </View>
      {open ? (
        <Text style={[styles.faqA, { color: colors.mutedForeground }]}>{a}</Text>
      ) : null}
    </Pressable>
  );
}

export default function SupportScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const version = Constants.expoConfig?.version ?? "1.0.0";

  const contactSupport = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      "Soporte QR App",
    )}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Soporte" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Preguntas frecuentes
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {FAQS.map((f) => (
            <FaqItem key={f.q} q={f.q} a={f.a} />
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          ¿Necesitás más ayuda?
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.contactCard,
            {
              backgroundColor: colors.primary,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
          onPress={contactSupport}
        >
          <Feather name="mail" size={20} color="#FFFFFF" />
          <View style={styles.contactTextWrap}>
            <Text style={styles.contactTitle}>Contactar soporte</Text>
            <Text style={styles.contactSub}>{SUPPORT_EMAIL}</Text>
          </View>
          <Feather name="chevron-right" size={18} color="#FFFFFF" />
        </Pressable>

        <Text style={[styles.version, { color: colors.mutedForeground }]}>
          QR App · Versión {version}
          {Platform.OS !== "web" ? ` (${Platform.OS})` : ""}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, gap: 12 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 2,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    paddingHorizontal: 16,
  },
  faqItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  faqQ: { fontSize: 15, fontWeight: "600", flex: 1, lineHeight: 20 },
  faqA: { fontSize: 14, lineHeight: 20, marginTop: 10 },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
  },
  contactTextWrap: { flex: 1 },
  contactTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  contactSub: { color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 2 },
  version: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 24,
  },
});
