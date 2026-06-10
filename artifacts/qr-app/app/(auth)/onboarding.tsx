import React, { useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/Button";

const DIETARY = [
  "Sin restricciones",
  "Celíaco",
  "Vegetariano",
  "Vegano",
  "Intolerante a la lactosa",
  "Alérgico a frutos secos",
  "Alérgico al marisco",
  "Diabético",
];

const CUISINES = [
  "Paraguaya",
  "Argentina",
  "Brasileña",
  "Italiana",
  "Japonesa",
  "China",
  "Mexicana",
  "Peruana",
  "Americana",
  "Española",
  "Francesa",
  "Árabe",
];

const FREQUENCIES = [
  "Raramente",
  "Una vez al mes",
  "Una vez por semana",
  "Varias veces por semana",
];

const TUTORIAL_SLIDES = [
  {
    icon: "grid" as const,
    title: "Escaneá el código QR",
    desc: "Apuntá la cámara al QR de tu mesa y accedé al menú al instante.",
  },
  {
    icon: "shopping-cart" as const,
    title: "Pedí sin esperar",
    desc: "Elegí tus platos favoritos y enviá tu pedido directamente a la cocina.",
  },
  {
    icon: "award" as const,
    title: "Ganás puntos",
    desc: "Cada pedido suma puntos que podés canjear por descuentos y recompensas.",
  },
  {
    icon: "credit-card" as const,
    title: "Pagá con tu celular",
    desc: "Pagá tu cuenta desde la app sin llamar al mozo. Rápido y seguro.",
  },
];

export default function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const user = useAuthStore((s) => s.user);

  const [step, setStep] = useState(0);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [dietary, setDietary] = useState<string[]>([]);
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [frequency, setFrequency] = useState("");
  const [loading, setLoading] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  const toggleDietary = (item: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (item === "Sin restricciones") {
      setDietary(dietary.includes(item) ? [] : ["Sin restricciones"]);
      return;
    }
    setDietary((prev) =>
      prev.includes(item)
        ? prev.filter((d) => d !== item)
        : [...prev.filter((d) => d !== "Sin restricciones"), item],
    );
  };

  const toggleCuisine = (item: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCuisines((prev) =>
      prev.includes(item) ? prev.filter((c) => c !== item) : [...prev, item],
    );
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await completeOnboarding({
        dietary_restrictions: dietary,
        favorite_cuisines: cuisines,
        dining_frequency: frequency || FREQUENCIES[0],
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step < 3) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setStep((s) => s + 1);
    }
  };

  const skipCarousel = () => {
    setStep(1);
  };

  const renderTutorialSlide = ({ item }: { item: (typeof TUTORIAL_SLIDES)[0] }) => (
    <View style={[styles.slide, { width }]}>
      <View style={[styles.slideIcon, { backgroundColor: colors.primary + "20" }]}>
        <Feather name={item.icon} size={48} color={colors.primary} />
      </View>
      <Text style={[styles.slideTitle, { color: colors.foreground }]}>
        {item.title}
      </Text>
      <Text style={[styles.slideDesc, { color: colors.mutedForeground }]}>
        {item.desc}
      </Text>
    </View>
  );

  const renderDots = (total: number, active: number) => (
    <View style={styles.dots}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor:
                i === active ? colors.primary : colors.border,
              width: i === active ? 20 : 8,
            },
          ]}
        />
      ))}
    </View>
  );

  const renderChips = (
    items: string[],
    selected: string[],
    onToggle: (item: string) => void,
  ) => (
    <View style={styles.chips}>
      {items.map((item) => {
        const isSelected = selected.includes(item);
        return (
          <Pressable
            key={item}
            onPress={() => onToggle(item)}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected ? colors.primary : colors.muted,
                borderColor: isSelected ? colors.primary : "transparent",
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                { color: isSelected ? "#FFFFFF" : colors.foreground },
              ]}
            >
              {item}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  const paddingTop = insets.top + (Platform.OS === "web" ? 67 : 20);
  const paddingBottom = insets.bottom + 32;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop }]}>
        <View style={styles.stepIndicator}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.stepDot,
                {
                  backgroundColor:
                    i <= step ? colors.primary : colors.border,
                  width: i === step ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>
        {step === 0 ? (
          <Pressable onPress={skipCarousel} hitSlop={8}>
            <Text style={[styles.skipText, { color: colors.mutedForeground }]}>
              Omitir
            </Text>
          </Pressable>
        ) : null}
      </View>

      {step === 0 && (
        <View style={styles.stepContent}>
          <FlatList
            ref={flatListRef}
            data={TUTORIAL_SLIDES}
            renderItem={renderTutorialSlide}
            keyExtractor={(_, i) => String(i)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / width);
              setCarouselIndex(idx);
            }}
          />
          {renderDots(TUTORIAL_SLIDES.length, carouselIndex)}
          <View style={[styles.bottomAction, { paddingBottom }]}>
            {carouselIndex < TUTORIAL_SLIDES.length - 1 ? (
              <Button
                title="Siguiente"
                onPress={() => {
                  const next = carouselIndex + 1;
                  flatListRef.current?.scrollToIndex({ index: next, animated: true });
                  setCarouselIndex(next);
                }}
                fullWidth
                size="lg"
              />
            ) : (
              <Button
                title="Empezar"
                onPress={nextStep}
                fullWidth
                size="lg"
              />
            )}
          </View>
        </View>
      )}

      {step === 1 && (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.stepTitle, { color: colors.foreground }]}>
            Restricciones alimentarias
          </Text>
          <Text style={[styles.stepSubtitle, { color: colors.mutedForeground }]}>
            Seleccioná las que apliquen para personalizar tu experiencia.
          </Text>
          {renderChips(DIETARY, dietary, toggleDietary)}
          <Button
            title="Siguiente"
            onPress={nextStep}
            fullWidth
            size="lg"
            style={styles.actionBtn}
          />
        </ScrollView>
      )}

      {step === 2 && (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.stepTitle, { color: colors.foreground }]}>
            Cocinas favoritas
          </Text>
          <Text style={[styles.stepSubtitle, { color: colors.mutedForeground }]}>
            Seleccioná las que más te gustan para ver mejores recomendaciones.
          </Text>
          {renderChips(CUISINES, cuisines, toggleCuisine)}
          <Button
            title="Siguiente"
            onPress={nextStep}
            fullWidth
            size="lg"
            style={styles.actionBtn}
          />
        </ScrollView>
      )}

      {step === 3 && (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.stepTitle, { color: colors.foreground }]}>
            ¿Con qué frecuencia comés en restaurantes?
          </Text>
          <Text style={[styles.stepSubtitle, { color: colors.mutedForeground }]}>
            Esto nos ayuda a ofrecerte mejores beneficios.
          </Text>
          <View style={styles.radioGroup}>
            {FREQUENCIES.map((item) => (
              <Pressable
                key={item}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFrequency(item);
                }}
                style={[
                  styles.radioItem,
                  {
                    borderColor:
                      frequency === item ? colors.primary : colors.border,
                    backgroundColor:
                      frequency === item ? colors.primary + "10" : colors.background,
                  },
                ]}
              >
                <View
                  style={[
                    styles.radioCircle,
                    {
                      borderColor:
                        frequency === item ? colors.primary : colors.border,
                    },
                  ]}
                >
                  {frequency === item ? (
                    <View
                      style={[
                        styles.radioFill,
                        { backgroundColor: colors.primary },
                      ]}
                    />
                  ) : null}
                </View>
                <Text style={[styles.radioText, { color: colors.foreground }]}>
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={[styles.pointsBox, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "40" }]}>
            <Feather name="award" size={20} color={colors.primary} />
            <Text style={[styles.pointsText, { color: colors.primary }]}>
              Al completar ganás{" "}
              <Text style={{ fontWeight: "700" }}>50 puntos</Text> de bienvenida
            </Text>
          </View>
          <Button
            title="Completar"
            onPress={handleComplete}
            loading={loading}
            fullWidth
            size="lg"
            style={styles.actionBtn}
          />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  stepIndicator: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  stepDot: {
    height: 8,
    borderRadius: 4,
  },
  skipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  stepContent: {
    flex: 1,
  },
  slide: {
    paddingHorizontal: 40,
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  slideIcon: {
    width: 120,
    height: 120,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  slideDesc: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 16,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  bottomAction: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "500",
  },
  radioGroup: {
    gap: 12,
    marginBottom: 24,
  },
  radioItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioFill: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioText: {
    fontSize: 15,
    fontWeight: "500",
  },
  pointsBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  pointsText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  actionBtn: {
    marginTop: 8,
  },
});
