import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/auth.store";
import { useBillingStatus, useMe } from "../../hooks/queries";

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <View className="flex-row items-center justify-between py-2">
      <Text className="text-sm text-slate-400">{label}</Text>
      <Text className="text-sm font-medium text-white">{value ?? "—"}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const logout = useAuthStore((s) => s.logout);
  const token = useAuthStore((s) => s.accessToken);
  const { data: me, isLoading } = useMe();
  const { data: billing } = useBillingStatus();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  if (isLoading || !token) {
    return (
      <View className="flex-1 items-center justify-center bg-imut-surface">
        <ActivityIndicator color="#0ea5e9" />
      </View>
    );
  }

  const subStatus = me?.subscription?.status ?? billing?.subscription?.status;
  const subEnd = me?.subscription?.currentPeriodEnd;

  return (
    <View className="flex-1 bg-imut-surface px-4 pt-4">
      {/* Usuário */}
      <View className="rounded-xl border border-slate-700 bg-slate-800/80 p-4">
        <View className="mb-3 flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-imut-primary/20">
            <Ionicons name="person" size={28} color="#0ea5e9" />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-white">{me?.user?.name}</Text>
            <Text className="text-sm text-slate-400">{me?.user?.email}</Text>
          </View>
        </View>
        <View className="border-t border-slate-700 pt-2">
          <InfoRow label="Papel" value={me?.role} />
          {me?.user?.phone && <InfoRow label="Telefone" value={me.user.phone} />}
        </View>
      </View>

      {/* Empresa */}
      <View className="mt-4 rounded-xl border border-slate-700 bg-slate-800/80 p-4">
        <View className="mb-1 flex-row items-center gap-2">
          <Ionicons name="business-outline" size={16} color="#0ea5e9" />
          <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Empresa
          </Text>
        </View>
        <InfoRow label="Nome" value={me?.company?.name} />
        <InfoRow label="Slug" value={me?.company?.slug} />
        <InfoRow
          label="Assinatura"
          value={subStatus}
        />
        {subEnd && (
          <InfoRow
            label="Válida até"
            value={new Date(subEnd).toLocaleDateString("pt-BR")}
          />
        )}
        <InfoRow
          label="Responsáveis"
          value={
            me?.limits
              ? `${me.limits.responsiblesUsed} / ${me.limits.maxResponsibles}`
              : undefined
          }
        />
      </View>

      {/* Ações */}
      {me?.role === "OWNER" && (
        <Pressable
          onPress={() => router.push("/subscription")}
          className="mt-4 flex-row items-center justify-between rounded-xl border border-imut-primary/40 bg-slate-800/80 p-4"
        >
          <View className="flex-row items-center gap-2">
            <Ionicons name="card-outline" size={20} color="#0ea5e9" />
            <Text className="font-semibold text-imut-primary">Gerenciar assinatura</Text>
          </View>
          {billing?.requiresPayment && (
            <View className="rounded-full bg-amber-400/20 px-2 py-0.5">
              <Text className="text-xs text-amber-400">Pendente</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={16} color="#0ea5e9" />
        </Pressable>
      )}

      <Pressable
        onPress={handleLogout}
        className="mt-4 flex-row items-center justify-center gap-2 rounded-xl bg-red-900/30 py-4"
      >
        <Ionicons name="log-out-outline" size={20} color="#f87171" />
        <Text className="font-semibold text-red-400">Sair da conta</Text>
      </Pressable>
    </View>
  );
}
