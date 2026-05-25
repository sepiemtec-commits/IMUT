import { useState } from "react";
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
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCreateDevice } from "../../hooks/queries";
import type { MqttCredentials } from "../../lib/types";

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  secureTextEntry = false,
  hint,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "decimal-pad" | "numeric";
  secureTextEntry?: boolean;
  hint?: string;
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
        secureTextEntry={secureTextEntry}
        className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white"
      />
      {hint && <Text className="mt-1 text-xs text-slate-500">{hint}</Text>}
    </View>
  );
}

export default function NewDeviceScreen() {
  const createDevice = useCreateDevice();

  const [name, setName] = useState("");
  const [environment, setEnvironment] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [mqttPassword, setMqttPassword] = useState("");
  const [tempMax, setTempMax] = useState("30");
  const [humidityMax, setHumidityMax] = useState("80");
  const [alertCycles, setAlertCycles] = useState("2");

  function handleSave() {
    if (!name.trim() || !environment.trim() || !mqttPassword.trim()) {
      Alert.alert("Campos obrigatórios", "Preencha nome, ambiente e senha MQTT.");
      return;
    }
    if (mqttPassword.length < 8) {
      Alert.alert("Senha fraca", "A senha MQTT deve ter no mínimo 8 caracteres.");
      return;
    }

    createDevice.mutate(
      {
        name: name.trim(),
        environment: environment.trim(),
        serialNumber: serialNumber.trim() || undefined,
        mqttPassword,
        tempMaxCelsius: Number(tempMax) || 30,
        humidityMaxPercent: Number(humidityMax) || 80,
        alertAfterCycles: Number(alertCycles) || 2,
      },
      {
        onSuccess: ({ mqttCredentials }: { device: unknown; mqttCredentials: MqttCredentials }) => {
          Alert.alert(
            "Dispositivo cadastrado!",
            `Configure o ESP32 com:\n\n` +
              `Broker: ${mqttCredentials.broker}\n` +
              `Usuário: ${mqttCredentials.username}\n` +
              `Senha: ${mqttPassword}\n` +
              `Tópico: ${mqttCredentials.topic}\n\n` +
              `Anote esses dados — a senha não será exibida novamente.`,
            [{ text: "Entendido", onPress: () => router.back() }],
          );
        },
        onError: (err: Error) => {
          Alert.alert("Erro", err.message ?? "Não foi possível cadastrar o dispositivo.");
        },
      },
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-imut-surface"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView className="px-4 pt-4" keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View className="mb-6 flex-row items-center gap-3">
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color="#94a3b8" />
          </Pressable>
          <Text className="text-xl font-bold text-white">Novo dispositivo ESP32</Text>
        </View>

        {/* Identificação */}
        <Text className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Identificação
        </Text>
        <Field
          label="Nome *"
          value={name}
          onChangeText={setName}
          placeholder="ex: Sensor Câmara Fria 1"
          hint="Nome exibido no app"
        />
        <Field
          label="Ambiente *"
          value={environment}
          onChangeText={setEnvironment}
          placeholder="ex: Câmara Fria A"
          hint="Local monitorado pelo sensor"
        />
        <Field
          label="Número de série"
          value={serialNumber}
          onChangeText={setSerialNumber}
          placeholder="ex: ESP32-001 (opcional)"
        />

        {/* MQTT */}
        <Text className="mb-3 mt-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Credenciais MQTT
        </Text>
        <View className="mb-4 rounded-xl border border-sky-800/50 bg-sky-900/20 p-3">
          <Text className="text-xs text-sky-300">
            O usuário MQTT será gerado automaticamente. Defina uma senha forte para autenticar o ESP32 no broker HiveMQ Cloud.
          </Text>
        </View>
        <Field
          label="Senha MQTT *"
          value={mqttPassword}
          onChangeText={setMqttPassword}
          placeholder="Mínimo 8 caracteres"
          secureTextEntry
          hint="Guarde essa senha — será usada no código do ESP32"
        />

        {/* Limites de alerta */}
        <Text className="mb-3 mt-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Limites de alerta
        </Text>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Field
              label="Temp. máx (°C)"
              value={tempMax}
              onChangeText={setTempMax}
              keyboardType="decimal-pad"
              placeholder="30"
            />
          </View>
          <View className="flex-1">
            <Field
              label="Umidade máx (%)"
              value={humidityMax}
              onChangeText={setHumidityMax}
              keyboardType="decimal-pad"
              placeholder="80"
            />
          </View>
        </View>
        <Field
          label="Alertar após N ciclos consecutivos"
          value={alertCycles}
          onChangeText={setAlertCycles}
          keyboardType="numeric"
          placeholder="2"
          hint="Evita alertas de leituras pontuais (padrão: 2 ciclos = 8 min)"
        />

        {/* Botão salvar */}
        <Pressable
          onPress={handleSave}
          disabled={createDevice.isPending}
          className={`mb-8 mt-4 items-center rounded-xl py-4 ${
            createDevice.isPending ? "bg-slate-700" : "bg-imut-primary"
          }`}
        >
          {createDevice.isPending ? (
            <Text className="font-semibold text-slate-400">Cadastrando...</Text>
          ) : (
            <View className="flex-row items-center gap-2">
              <Ionicons name="save-outline" size={20} color="white" />
              <Text className="font-bold text-white">Cadastrar dispositivo</Text>
            </View>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
