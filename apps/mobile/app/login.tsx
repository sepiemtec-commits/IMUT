import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { ApiError, apiFetch } from "../lib/api";
import { useAuthStore } from "../store/auth.store";

export default function LoginScreen() {
  const setSession = useAuthStore((s) => s.setSession);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const path = mode === "login" ? "/auth/login" : "/auth/register";
      const body =
        mode === "login"
          ? { email, password }
          : { email, password, name, organizationName: companyName };

      const data = await apiFetch<{
        accessToken: string;
        refreshToken: string;
        user: { id: string; email: string; name: string; role: string };
        company: { id: string; name?: string };
        subscription: { status: string };
      }>(path, { method: "POST", body: JSON.stringify(body) });

      await setSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role as "OWNER" | "ADMIN" | "VIEWER",
        },
        company: data.company,
        subscriptionStatus: data.subscription.status,
      });

      const billing = await apiFetch<{
        requiresPayment: boolean;
      }>("/billing/status", { token: data.accessToken });

      if (billing.requiresPayment && data.user.role === "OWNER") {
        const checkout = await apiFetch<{ url: string }>("/billing/checkout", {
          method: "POST",
          token: data.accessToken,
        });
        await WebBrowser.openBrowserAsync(checkout.url);
        router.replace("/subscription");
      } else if (billing.requiresPayment) {
        router.replace("/subscription");
      } else {
        router.replace("/(tabs)");
      }
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError("Erro de conexão");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      className="flex-1 justify-center bg-imut-surface px-6"
      style={{ flex: 1, justifyContent: "center", backgroundColor: "#0f172a", paddingHorizontal: 24 }}
    >
      <Text className="text-3xl font-bold text-white" style={{ fontSize: 28, fontWeight: "700", color: "#fff" }}>
        IMUT
      </Text>
      <Text className="mt-1 text-slate-400" style={{ marginTop: 4, color: "#94a3b8" }}>
        Monitoramento IoT
      </Text>

      <Text className="mt-8 text-xl font-semibold text-white">
        {mode === "login" ? "Entrar" : "Criar conta"}
      </Text>

      {mode === "register" && (
        <>
          <TextInput
            className="mt-4 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
            placeholder="Seu nome"
            placeholderTextColor="#64748b"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            className="mt-3 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
            placeholder="Nome da empresa"
            placeholderTextColor="#64748b"
            value={companyName}
            onChangeText={setCompanyName}
          />
        </>
      )}

      <TextInput
        className="mt-4 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
        placeholder="E-mail"
        placeholderTextColor="#64748b"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        className="mt-3 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
        placeholder="Senha"
        placeholderTextColor="#64748b"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error && <Text className="mt-3 text-red-400">{error}</Text>}

      <Pressable
        onPress={handleSubmit}
        disabled={loading}
        className="mt-6 items-center rounded-xl bg-imut-primary py-3.5"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-base font-semibold text-white">
            {mode === "login" ? "Entrar" : "Registrar"}
          </Text>
        )}
      </Pressable>

      <Pressable
        className="mt-4"
        onPress={() => setMode(mode === "login" ? "register" : "login")}
      >
        <Text className="text-center text-slate-400">
          {mode === "login" ? "Criar conta" : "Já tenho conta"}
        </Text>
      </Pressable>
    </View>
  );
}
