import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import LoadingScreen from "@/components/LoadingScreen";
import { useAuthStore } from "@/stores/authStore";
import { setUnauthorizedHandler } from "@/services/api";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isAuthenticated, isGuest, isLoading, isNewUser, logout } =
    useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
    });
  }, [logout]);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (isAuthenticated || isGuest) {
      if (isNewUser) {
        const inOnboarding =
          segments[0] === "(auth)" && segments[1] === "onboarding";
        if (!inOnboarding) {
          router.replace("/(auth)/onboarding");
        }
      } else if (!segments[0] || inAuthGroup) {
        router.replace("/(tabs)");
      }
    } else {
      if (!inAuthGroup) {
        router.replace("/(auth)/login");
      }
    }
  }, [isAuthenticated, isGuest, isLoading, isNewUser]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ animation: "none" }} />
      <Stack.Screen name="(auth)" options={{ animation: "none" }} />
      <Stack.Screen name="(tabs)" options={{ animation: "none" }} />
      <Stack.Screen name="scanner" options={{ animation: "slide_from_bottom" }} />
      <Stack.Screen name="session/[sessionId]" />
      <Stack.Screen name="product/[productId]" />
      <Stack.Screen name="reviews/[productId]" />
      <Stack.Screen name="cart" options={{ animation: "slide_from_bottom" }} />
      <Stack.Screen name="order/[orderId]" />
      <Stack.Screen name="split" options={{ animation: "slide_from_bottom" }} />
      <Stack.Screen
        name="payment-success"
        options={{ animation: "slide_from_bottom", gestureEnabled: false }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <RootLayoutNav />
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
