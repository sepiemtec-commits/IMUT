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

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Proprietário",
  ADMIN: "Administrador",
  RESPONSIBLE: "Responsável",
};

export default function ProfileScreen() {
  const logout = useAuthStore((s) => s.logout);
  const storeUser = useAuthStore((s) => s.user);
  const storeCompany = useAuthStore((s) => s.company);
  const subscriptionStatus = useAuthStore((s) => s.subscriptionStatus);

  const { data: me, isLoading: meLoading } = useMe();
  const { data: billing } = useBillingStatus();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  // Usa dados do store imediatamente; enriquece com /auth/me quando disponível
  const userName = me?.user?.name ?? storeUser?.name;
  const userEmail = me?.user?.email ?? storeUser?.email;
  const userPhone = me?.user?.phone;
  const role = me?.role ?? storeUser?.role;
  const companyName = me?.company?.name ?? storeCompany?.name;
  const companySlug = me?.company?.slug;
  const subStatus =
    me?.subscription?.status ??
    billing?.subscription?.status ??
    subscriptionStatus ??
    "—";
  const subEnd = me?.subscription?.currentPeriodEnd;
  const isOwner = role === "OWNER";

  return (
    <View className="flex-1 bg-imut-surface px-4 pt-4">
      {/* Usuário */}
      <View className="rounded-xl border border-slate-700 bg-slate-800/80 p-4">
        <View className="mb-3 flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-imut-primary/20">
            <Ionicons name="person" size={28} color="#0ea5e9" />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-white">
              {userName ?? "Carregando..."}
            </Text>
            <Text className="text-sm text-slate-400">{userEmail}</Text>
          </View>
          {meLoading && <ActivityIndicator size="small" color="#0ea5e9" />}
        </View>
        <View className="border-t border-slate-700 pt-2">
          <InfoRow label="Papel" value={role ? (ROLE_LABEL[role] ?? role) : undefined} />
          {userPhone ? <InfoRow label="Telefone" value={userPhone} /> : null}
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
        <InfoRow label="Nome" value={companyName} />
        {companySlug ? <InfoRow label="Slug" value={companySlug} /> : null}
        <InfoRow label="Assinatura" value={subStatus} />
        {subEnd ? (
          <InfoRow
            label="Válida até"
            value={new Date(subEnd).toLocaleDateString("pt-BR")}
          />
        ) : null}
        {me?.limits ? (
          <InfoRow
            label="Responsáveis"
            value={`${me.limits.responsiblesUsed} / ${me.limits.maxResponsibles}`}
          />
        ) : null}
      </View>

      {/* Ações */}
      {isOwner && (
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
