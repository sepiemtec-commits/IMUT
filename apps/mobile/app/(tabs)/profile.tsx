import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "../../store/auth.store";
import { useBillingStatus } from "../../hooks/queries";
import { registerPushToken } from "../../lib/push";

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const company = useAuthStore((s) => s.company);
  const logout = useAuthStore((s) => s.logout);
  const token = useAuthStore((s) => s.accessToken);
  const { data: billing } = useBillingStatus();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const handlePush = async () => {
    if (token) {
      try {
        await registerPushToken(token);
      } catch {
        /* permissão negada ou simulador */
      }
    }
  };

  return (
    <View className="flex-1 bg-imut-surface px-4 pt-4">
      <View className="rounded-xl border border-slate-700 bg-slate-800/80 p-4">
        <Text className="text-xs uppercase text-slate-500">Usuário</Text>
        <Text className="mt-1 text-lg font-semibold text-white">{user?.name}</Text>
        <Text className="text-slate-400">{user?.email}</Text>
        <Text className="mt-2 text-sm text-imut-primary">Papel: {user?.role}</Text>
      </View>

      <View className="mt-4 rounded-xl border border-slate-700 bg-slate-800/80 p-4">
        <Text className="text-xs uppercase text-slate-500">Empresa</Text>
        <Text className="mt-1 text-lg text-white">{company?.name ?? company?.id}</Text>
        <Text className="mt-2 text-sm text-slate-400">
          Assinatura: {billing?.subscription.status ?? "—"}
        </Text>
      </View>

      {user?.role === "OWNER" && (
        <Pressable
          onPress={() => router.push("/subscription")}
          className="mt-4 rounded-xl border border-imut-primary bg-slate-800/80 p-4"
        >
          <Text className="font-semibold text-imut-primary">Gerenciar assinatura</Text>
          {billing?.requiresPayment && (
            <Text className="mt-1 text-sm text-amber-400">Pagamento pendente</Text>
          )}
        </Pressable>
      )}

      <Pressable
        onPress={() => void handlePush()}
        className="mt-3 rounded-xl border border-slate-700 bg-slate-800/80 p-4"
      >
        <Text className="text-white">Ativar notificações push</Text>
      </Pressable>

      <Pressable
        onPress={handleLogout}
        className="mt-8 items-center rounded-xl bg-red-900/40 py-3"
      >
        <Text className="font-semibold text-red-400">Sair</Text>
      </Pressable>
    </View>
  );
}
