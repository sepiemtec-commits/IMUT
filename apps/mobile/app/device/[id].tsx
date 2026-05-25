import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useDevices, useUpdateDevice } from "../../hooks/queries";
import { API_BASE_URL } from "../../lib/api";
import { useAuthStore } from "../../store/auth.store";

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  hint,
  readonly = false,
}: {
  label: string;
  value: string;
  onChangeText?: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "decimal-pad" | "numeric";
  hint?: string;
  readonly?: boolean;
}) {
  return (
    <View className="mb-4">
      <Text className="mb-1 text-sm font-medium text-slate-300">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#475569"
        keyboardType={keyboardType}
        editable={!readonly}
        className={`rounded-lg border px-4 py-3 text-white ${
          readonly
            ? "border-slate-800 bg-slate-900 text-slate-500"
            : "border-slate-700 bg-slate-800"
        }`}
      />
      {hint && <Text className="mt-1 text-xs text-slate-500">{hint}</Text>}
    </View>
  );
}

export default function EditDeviceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: devices } = useDevices();
  const updateDevice = useUpdateDevice();
  const token = useAuthStore((s) => s.accessToken);

  const device = devices?.find((d) => d.id === id);

  const [name, setName] = useState("");
  const [environment, setEnvironment] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [tempMax, setTempMax] = useState("");
  const [humidityMax, setHumidityMax] = useState("");
  const [alertCycles, setAlertCycles] = useState("");

  useEffect(() => {
    if (device) {
      setName(device.name);
      setEnvironment(device.environment);
      setSerialNumber(device.serialNumber ?? "");
      setTempMax(String(device.tempMaxCelsius));
      setHumidityMax(String(device.humidityMaxPercent));
      setAlertCycles(String(device.alertAfterCycles));
    }
  }, [device]);

  function handleSave() {
    if (!name.trim() || !environment.trim()) {
      Alert.alert("Campos obrigatórios", "Preencha nome e ambiente.");
      return;
    }
    updateDevice.mutate(
      {
        id: id!,
        name: name.trim(),
        environment: environment.trim(),
        serialNumber: serialNumber.trim() || undefined,
        tempMaxCelsius: Number(tempMax) || 30,
        humidityMaxPercent: Number(humidityMax) || 80,
        alertAfterCycles: Number(alertCycles) || 2,
      },
      {
        onSuccess: () => {
          Alert.alert("Salvo!", "Dispositivo atualizado com sucesso.", [
            { text: "OK", onPress: () => router.back() },
          ]);
        },
        onError: (err: Error) => Alert.alert("Erro", err.message),
      },
    );
  }

  async function handleExport(format: "csv" | "xlsx") {
    const url = `${API_BASE_URL}/v1/devices/${id}/readings/export?format=${format}&hours=168`;
    Alert.alert(
      `Exportar ${format.toUpperCase()}`,
      `Exportar leituras das últimas 168h?\n\nLink:\n${url}`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Copiar link",
          onPress: async () => {
            try {
              const { setStringAsync } = await import("expo-clipboard");
              await setStringAsync(url);
              Alert.alert("Link copiado!", "Cole no navegador para baixar.");
            } catch {
              Alert.alert("Link", url);
            }
          },
        },
      ],
    );
  }

  if (!device) {
    return (
      <View className="flex-1 items-center justify-center bg-imut-surface">
        <Text className="text-slate-400">Dispositivo não encontrado.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-imut-surface"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView className="px-4 pt-4" keyboardShouldPersistTaps="handled">
        <View className="mb-4">
          <Text className="text-slate-400">{device.environment}</Text>
        </View>

        {/* MQTT Info (readonly) */}
        <Text className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Informações MQTT
        </Text>
        <View className="mb-4 rounded-xl border border-slate-700 bg-slate-800/60 p-4">
          <View className="mb-2 flex-row items-center gap-2">
            <Ionicons name="wifi-outline" size={16} color="#0ea5e9" />
            <Text className="text-sm font-semibold text-white">Credenciais do broker</Text>
          </View>
          <Text className="text-xs text-slate-400">Usuário MQTT:</Text>
          <Text className="mb-2 font-mono text-sm text-sky-300" selectable>
            {device.mqttUsername}
          </Text>
          <Text className="text-xs text-slate-400">Tópico:</Text>
          <Text className="font-mono text-xs text-green-300" selectable>
            imut/[companyId]/{device.id}/telemetry
          </Text>
          <Text className="mt-2 text-xs text-slate-500">
            ID do dispositivo: {device.id}
          </Text>
        </View>

        {/* Exportação */}
        <Text className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Exportar dados
        </Text>
        <View className="mb-6 flex-row gap-3">
          <Pressable
            onPress={() => handleExport("csv")}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-slate-600 py-3"
          >
            <Ionicons name="download-outline" size={18} color="#94a3b8" />
            <Text className="font-medium text-slate-300">CSV</Text>
          </Pressable>
          <Pressable
            onPress={() => handleExport("xlsx")}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-green-800/60 bg-green-900/20 py-3"
          >
            <Ionicons name="document-outline" size={18} color="#4ade80" />
            <Text className="font-medium text-green-400">Excel</Text>
          </Pressable>
        </View>

        {/* Edição */}
        <Text className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Configurações
        </Text>
        <Field label="Nome *" value={name} onChangeText={setName} placeholder="Nome do dispositivo" />
        <Field label="Ambiente *" value={environment} onChangeText={setEnvironment} placeholder="Local monitorado" />
        <Field label="Número de série" value={serialNumber} onChangeText={setSerialNumber} placeholder="Opcional" />

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Field
              label="Temp. máx (°C)"
              value={tempMax}
              onChangeText={setTempMax}
              keyboardType="decimal-pad"
            />
          </View>
          <View className="flex-1">
            <Field
              label="Umidade máx (%)"
              value={humidityMax}
              onChangeText={setHumidityMax}
              keyboardType="decimal-pad"
            />
          </View>
        </View>
        <Field
          label="Alertar após N ciclos consecutivos"
          value={alertCycles}
          onChangeText={setAlertCycles}
          keyboardType="numeric"
          hint="Padrão: 2 ciclos = ~8 minutos acima do limite"
        />

        {/* Status readonly */}
        <Field
          label="Status atual"
          value={device.status}
          readonly
        />
        <Field
          label="Cadastrado em"
          value={new Date(device.createdAt).toLocaleString("pt-BR")}
          readonly
        />

        <Pressable
          onPress={handleSave}
          disabled={updateDevice.isPending}
          className={`mb-8 mt-4 items-center rounded-xl py-4 ${
            updateDevice.isPending ? "bg-slate-700" : "bg-imut-primary"
          }`}
        >
          <View className="flex-row items-center gap-2">
            <Ionicons name="save-outline" size={20} color="white" />
            <Text className="font-bold text-white">
              {updateDevice.isPending ? "Salvando..." : "Salvar alterações"}
            </Text>
          </View>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
