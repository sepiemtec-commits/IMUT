import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/auth.store";
import {
  useAddResponsible,
  useBillingStatus,
  useMe,
  useRemoveResponsible,
  useResponsibles,
} from "../../hooks/queries";

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
  VIEWER: "Visualizador",
};

function AddModal({
  visible,
  onClose,
  onAdd,
  loading,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (data: { name: string; email: string; phone?: string; role: "ADMIN" | "VIEWER" }) => void;
  loading: boolean;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"ADMIN" | "VIEWER">("VIEWER");

  const reset = () => {
    setName("");
    setEmail("");
    setPhone("");
    setRole("VIEWER");
  };

  const submit = () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert("Atenção", "Nome e e-mail são obrigatórios.");
      return;
    }
    onAdd({ name: name.trim(), email: email.trim(), phone: phone.trim() || undefined, role });
    reset();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <View className="rounded-t-2xl bg-slate-900 px-6 pb-10 pt-6">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-white">Novo Responsável</Text>
            <Pressable onPress={() => { reset(); onClose(); }} hitSlop={8}>
              <Ionicons name="close" size={24} color="#94a3b8" />
            </Pressable>
          </View>

          <Text className="mb-1 text-sm text-slate-400">Nome *</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Nome completo"
            placeholderTextColor="#475569"
            className="mb-3 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white"
          />

          <Text className="mb-1 text-sm text-slate-400">E-mail *</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="email@exemplo.com"
            placeholderTextColor="#475569"
            keyboardType="email-address"
            autoCapitalize="none"
            className="mb-3 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white"
          />

          <Text className="mb-1 text-sm text-slate-400">Telefone</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="(11) 99999-9999"
            placeholderTextColor="#475569"
            keyboardType="phone-pad"
            className="mb-4 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white"
          />

          <Text className="mb-2 text-sm text-slate-400">Perfil de acesso</Text>
          <View className="mb-6 flex-row gap-3">
            {(["VIEWER", "ADMIN"] as const).map((r) => (
              <Pressable
                key={r}
                onPress={() => setRole(r)}
                className={`flex-1 items-center rounded-lg border py-2 ${
                  role === r
                    ? "border-imut-primary bg-imut-primary/20"
                    : "border-slate-700 bg-slate-800"
                }`}
              >
                <Text className={role === r ? "font-semibold text-imut-primary" : "text-slate-400"}>
                  {ROLE_LABEL[r]}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={submit}
            disabled={loading}
            className="items-center rounded-xl bg-imut-primary py-4"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="font-semibold text-white">Adicionar</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function ProfileScreen() {
  const logout = useAuthStore((s) => s.logout);
  const storeUser = useAuthStore((s) => s.user);
  const storeCompany = useAuthStore((s) => s.company);
  const subscriptionStatus = useAuthStore((s) => s.subscriptionStatus);
  const [showAdd, setShowAdd] = useState(false);

  const { data: me, isLoading: meLoading } = useMe();
  const { data: billing } = useBillingStatus();
  const { data: resp, isLoading: respLoading } = useResponsibles();
  const addResp = useAddResponsible();
  const removeResp = useRemoveResponsible();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const handleRemove = (id: string, name: string) => {
    Alert.alert(
      "Remover responsável",
      `Deseja remover "${name}" da equipe?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: () => removeResp.mutate(id),
        },
      ],
    );
  };

  const userName = me?.user?.name ?? storeUser?.name;
  const userEmail = me?.user?.email ?? storeUser?.email;
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
  const canManage = role === "OWNER" || role === "ADMIN";
  const limit = resp?.limit ?? 5;
  const count = resp?.count ?? 0;

  return (
    <ScrollView className="flex-1 bg-imut-surface" contentContainerClassName="px-4 pt-4 pb-10">
      {/* Usuário */}
      <View className="rounded-xl border border-slate-700 bg-slate-800/80 p-4">
        <View className="mb-3 flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-imut-primary/20">
            <Ionicons name="person" size={28} color="#0ea5e9" />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-white">{userName ?? "..."}</Text>
            <Text className="text-sm text-slate-400">{userEmail}</Text>
          </View>
          {meLoading && <ActivityIndicator size="small" color="#0ea5e9" />}
        </View>
        <View className="border-t border-slate-700 pt-2">
          <InfoRow label="Papel" value={role ? (ROLE_LABEL[role] ?? role) : undefined} />
          {me?.user?.phone ? <InfoRow label="Telefone" value={me.user.phone} /> : null}
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
      </View>

      {/* Responsáveis */}
      <View className="mt-4 rounded-xl border border-slate-700 bg-slate-800/80 p-4">
        <View className="mb-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Ionicons name="people-outline" size={16} color="#0ea5e9" />
            <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Responsáveis
            </Text>
            <View className="rounded-full bg-slate-700 px-2 py-0.5">
              <Text className="text-xs text-slate-300">{count}/{limit}</Text>
            </View>
          </View>
          {canManage && count < limit && (
            <Pressable
              onPress={() => setShowAdd(true)}
              className="flex-row items-center gap-1 rounded-lg bg-imut-primary/20 px-3 py-1.5"
            >
              <Ionicons name="add" size={16} color="#0ea5e9" />
              <Text className="text-sm font-semibold text-imut-primary">Adicionar</Text>
            </Pressable>
          )}
        </View>

        {respLoading ? (
          <ActivityIndicator color="#0ea5e9" className="py-4" />
        ) : !resp?.responsibles.length ? (
          <View className="items-center py-4">
            <Ionicons name="person-add-outline" size={32} color="#475569" />
            <Text className="mt-2 text-center text-sm text-slate-500">
              Nenhum responsável cadastrado.{"\n"}
              {canManage ? "Use o botão Adicionar para incluir membros." : ""}
            </Text>
          </View>
        ) : (
          resp.responsibles.map((r) => (
            <View
              key={r.id}
              className="mb-2 flex-row items-center justify-between rounded-lg bg-slate-900/60 px-3 py-3"
            >
              <View className="flex-1">
                <Text className="font-medium text-white">{r.name}</Text>
                <Text className="text-xs text-slate-400">{r.email}</Text>
                {r.phone ? <Text className="text-xs text-slate-500">{r.phone}</Text> : null}
                <View className="mt-1 self-start rounded-full bg-slate-700 px-2 py-0.5">
                  <Text className="text-xs text-slate-300">{ROLE_LABEL[r.role] ?? r.role}</Text>
                </View>
              </View>
              {canManage && (
                <Pressable
                  onPress={() => handleRemove(r.id, r.name)}
                  hitSlop={8}
                  className="ml-3 rounded-lg bg-red-900/30 p-2"
                >
                  <Ionicons name="trash-outline" size={16} color="#f87171" />
                </Pressable>
              )}
            </View>
          ))
        )}
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

      <AddModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        loading={addResp.isPending}
        onAdd={(data) =>
          addResp.mutate(data, { onSuccess: () => setShowAdd(false) })
        }
      />
    </ScrollView>
  );
}
