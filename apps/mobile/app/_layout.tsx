import "../global.css";
import { useEffect } from "react";
import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { QueryProvider } from "../providers/QueryProvider";
import { useAuthStore } from "../store/auth.store";

// NativeWind v4 exige modo "class" para dark mode
StyleSheet.setFlag?.("darkMode", "class");

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f172a",
        }}
      >
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <QueryProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0f172a" },
          headerTintColor: "#f8fafc",
          headerBackTitle: "Voltar",
          contentStyle: { backgroundColor: "#0f172a" },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: "Entrar", headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="subscription"
          options={{
            title: "Assinatura",
            presentation: "modal",
            headerRight: () => (
              <Pressable onPress={() => router.back()} hitSlop={8}>
                <Ionicons name="close" size={24} color="#94a3b8" />
              </Pressable>
            ),
          }}
        />
        <Stack.Screen
          name="device/new"
          options={{ title: "Novo Dispositivo" }}
        />
        <Stack.Screen
          name="device/[id]"
          options={{ title: "Configurar Dispositivo" }}
        />
      </Stack>
    </QueryProvider>
  );
}
