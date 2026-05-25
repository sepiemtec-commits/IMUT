import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { ApiError, apiFetch } from "../lib/api";
import { useAuthStore } from "../store/auth.store";
import { useBillingStatus } from "../hooks/queries";
import { useQueryClient } from "@tanstack/react-query";

export default function SubscriptionScreen() {
  const token = useAuthStore((s) => s.accessToken)!;
  const user = useAuthStore((s) => s.user);
  const { data: billing, refetch } = useBillingStatus();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);

  const openCheckout = async () => {
    if (user?.role !== "OWNER") return;
    setLoading(true);
    try {
      const { url } = await apiFetch<{ url: string }>("/billing/checkout", {
        method: "POST",
        token,
      });
      await WebBrowser.openBrowserAsync(url);
      await refetch();
      void qc.invalidateQueries();
    } catch (e) {
      if (e instanceof ApiError && e.code === "STRIPE_NOT_CONFIGURED") {
        alert("Stripe não configurado no servidor");
      }
    } finally {
      setLoading(false);
    }
  };

  const openPortal = async () => {
    setLoading(true);
    try {
      const { url } = await apiFetch<{ url: string }>("/billing/portal", {
        method: "POST",
        token,
      });
      await WebBrowser.openBrowserAsync(url);
      await refetch();
    } catch {
      /* sem customer ainda */
    } finally {
      setLoading(false);
    }
  };

  const active =
    billing?.subscription.status === "ACTIVE" ||
    billing?.subscription.status === "TRIALING";

  return (
    <View className="flex-1 bg-imut-surface px-6 pt-6">
      <Text className="text-2xl font-bold text-white">Assinatura IMUT</Text>
      <Text className="mt-2 text-slate-400">Plano mensal · acesso completo ao monitoramento</Text>

      <View className="mt-6 rounded-xl border border-slate-700 bg-slate-800/80 p-4">
        <Text className="text-xs text-slate-500">Status atual</Text>
        <Text
          className={`mt-1 text-xl font-bold ${
            active ? "text-emerald-400" : "text-amber-400"
          }`}
        >
          {billing?.subscription.status ?? "INCOMPLETE"}
        </Text>
        {billing?.subscription.currentPeriodEnd && (
          <Text className="mt-2 text-sm text-slate-400">
            Válido até{" "}
            {new Date(billing.subscription.currentPeriodEnd).toLocaleDateString(
              "pt-BR",
            )}
          </Text>
        )}
      </View>

      {billing?.requiresPayment && user?.role === "OWNER" && (
        <Pressable
          onPress={() => void openCheckout()}
          disabled={loading}
          className="mt-6 items-center rounded-xl bg-imut-primary py-4"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-lg font-semibold text-white">
              Assinar agora — Checkout Stripe
            </Text>
          )}
        </Pressable>
      )}

      {active && user?.role === "OWNER" && (
        <Pressable
          onPress={() => void openPortal()}
          disabled={loading}
          className="mt-4 items-center rounded-xl border border-slate-600 py-3"
        >
          <Text className="text-white">Portal do cliente Stripe</Text>
        </Pressable>
      )}

      {active && (
        <Pressable
          onPress={() => router.replace("/(tabs)")}
          className="mt-6 items-center rounded-xl bg-emerald-900/40 py-3"
        >
          <Text className="text-emerald-400">Ir para o dashboard</Text>
        </Pressable>
      )}

      {user?.role !== "OWNER" && (
        <Text className="mt-6 text-center text-slate-500">
          Apenas o proprietário da conta pode gerenciar a assinatura.
        </Text>
      )}
    </View>
  );
}
