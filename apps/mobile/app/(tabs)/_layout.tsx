import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, View } from "react-native";
import { useAuthStore } from "../../store/auth.store";
import { useBillingStatus } from "../../hooks/queries";

export default function TabsLayout() {
  const isAuth = useAuthStore((s) => s.isAuthenticated());
  const { data: billing, isLoading } = useBillingStatus();

  if (!isAuth) {
    return <Redirect href="/login" />;
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-imut-surface">
        <ActivityIndicator color="#0ea5e9" />
      </View>
    );
  }

  if (billing?.requiresPayment) {
    return <Redirect href="/subscription" />;
  }

  return (
      <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#0f172a" },
        headerTintColor: "#f8fafc",
        headerTitleStyle: { fontWeight: "bold" },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: "#0f172a",
          borderTopColor: "#334155",
        },
        tabBarActiveTintColor: "#0ea5e9",
        tabBarInactiveTintColor: "#64748b",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sensors"
        options={{
          title: "Sensores",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="hardware-chip-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: "Alertas",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="warning-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Relatórios",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
