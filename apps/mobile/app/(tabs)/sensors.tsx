import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useDevices, useDeleteDevice } from "../../hooks/queries";
import { TelemetryChart } from "../../components/TelemetryChart";
import { StatusBadge } from "../../components/StatusBadge";
import { useReadings } from "../../hooks/queries";
import type { EnvironmentStatus } from "../../lib/types";
import { API_BASE_URL } from "../../lib/api";
import { useAuthStore } from "../../store/auth.store";

function deviceStatus(lastSeen: string | null): EnvironmentStatus {
  if (!lastSeen) return "offline";
  const diff = Date.now() - new Date(lastSeen).getTime();
  return diff > 20 * 60 * 1000 ? "offline" : "ok";
}

export default function SensorsScreen() {
  const { data: devices, isLoading, refetch, isRefetching } = useDevices();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const deleteDevice = useDeleteDevice();
  const token = useAuthStore((s) => s.accessToken);

  const activeId = selectedId ?? devices?.[0]?.id ?? null;
  const { data: readings, isLoading: loadingChart } = useReadings(activeId ?? "", 24);
  const selected = devices?.find((d) => d.id === activeId);

  function confirmDelete(id: string, name: string) {
    Alert.alert(
      "Remover dispositivo",
      `Deseja remover "${name}"? Os dados históricos serão mantidos.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: () => deleteDevice.mutate(id),
        },
      ],
    );
  }

  async function exportReadings(deviceId: string, deviceName: string, format: "csv" | "xlsx") {
    const url = `${API_BASE_URL}/v1/devices/${deviceId}/readings/export?format=${format}&hours=168`;
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Falha ao exportar");
      const blob = await res.blob();
      const ext = format === "xlsx" ? "xls" : "csv";
      Alert.alert(
        "Exportação pronta",
        `Arquivo ${deviceName}.${ext} gerado. Abra pelo link:\n${url}`,
      );
    } catch {
      Alert.alert("Erro", "Não foi possível exportar os dados.");
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-imut-surface px-4 pt-2"
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
          tintColor="#0ea5e9"
        />
      }
    >
      {/* Header com botão adicionar */}
      <View className="flex-row items-center justify-between py-2">
        <Text className="text-slate-400 flex-1">
          Temperatura e umidade em tempo real (4 min)
        </Text>
        <Pressable
          onPress={() => router.push("/device/new")}
          className="ml-3 flex-row items-center gap-1 rounded-lg bg-imut-primary px-3 py-2"
        >
          <Ionicons name="add" size={18} color="white" />
          <Text className="font-semibold text-white">Novo</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator className="mt-8" color="#0ea5e9" />
      ) : devices?.length === 0 ? (
        <View className="mt-16 items-center">
          <Ionicons name="hardware-chip-outline" size={64} color="#334155" />
          <Text className="mt-4 text-center text-slate-400">
            Nenhum dispositivo cadastrado.{"\n"}Toque em "Novo" para adicionar um ESP32.
          </Text>
        </View>
      ) : (
        <>
          {devices?.map((device) => (
            <Pressable
              key={device.id}
              onPress={() => setSelectedId(device.id)}
              className={`mb-2 mt-3 rounded-xl border p-4 ${
                activeId === device.id
                  ? "border-imut-primary bg-slate-800"
                  : "border-slate-700 bg-slate-800/60"
              }`}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="font-semibold text-white">{device.name}</Text>
                  <Text className="text-sm text-imut-primary">{device.environment}</Text>
                  {device.serialNumber && (
                    <Text className="text-xs text-slate-500">S/N: {device.serialNumber}</Text>
                  )}
                </View>
                <View className="flex-row items-center gap-2">
                  <StatusBadge status={deviceStatus(device.lastSeenAt)} />
                  <Pressable
                    onPress={() => router.push(`/device/${device.id}`)}
                    hitSlop={8}
                  >
                    <Ionicons name="create-outline" size={20} color="#64748b" />
                  </Pressable>
                  <Pressable
                    onPress={() => confirmDelete(device.id, device.name)}
                    hitSlop={8}
                  >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </Pressable>
                </View>
              </View>

              {device.latestReading && (
                <View className="mt-2 flex-row gap-6">
                  <Text className="text-orange-400">
                    {device.latestReading.temperature.toFixed(1)}°C
                  </Text>
                  <Text className="text-sky-400">
                    {device.latestReading.humidity.toFixed(0)}%
                  </Text>
                  <Text className="text-xs text-slate-500">
                    {new Date(device.latestReading.recordedAt).toLocaleTimeString("pt-BR")}
                  </Text>
                </View>
              )}

              {/* Limites configurados */}
              <View className="mt-2 flex-row gap-4">
                <Text className="text-xs text-slate-500">
                  Máx: {device.tempMaxCelsius}°C / {device.humidityMaxPercent}%
                </Text>
              </View>

              {/* Exportar (só para dispositivo selecionado) */}
              {activeId === device.id && (
                <View className="mt-3 flex-row gap-2">
                  <Pressable
                    onPress={() => exportReadings(device.id, device.name, "csv")}
                    className="flex-1 flex-row items-center justify-center gap-1 rounded-lg border border-slate-600 py-2"
                  >
                    <Ionicons name="download-outline" size={14} color="#94a3b8" />
                    <Text className="text-xs text-slate-400">CSV</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => exportReadings(device.id, device.name, "xlsx")}
                    className="flex-1 flex-row items-center justify-center gap-1 rounded-lg border border-slate-600 py-2"
                  >
                    <Ionicons name="document-outline" size={14} color="#94a3b8" />
                    <Text className="text-xs text-slate-400">Excel</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => router.push(`/device/${device.id}`)}
                    className="flex-1 flex-row items-center justify-center gap-1 rounded-lg border border-imut-primary/40 py-2"
                  >
                    <Ionicons name="settings-outline" size={14} color="#0ea5e9" />
                    <Text className="text-xs text-imut-primary">Config</Text>
                  </Pressable>
                </View>
              )}
            </Pressable>
          ))}

          {selected && activeId && (
            <View className="mt-4">
              <Text className="mb-2 text-lg font-semibold text-white">
                Gráficos — {selected.environment}
              </Text>
              <TelemetryChart
                readings={readings ?? []}
                loading={loadingChart}
                metric="temperature"
              />
              <View className="mt-4 mb-8">
                <TelemetryChart
                  readings={readings ?? []}
                  loading={loadingChart}
                  metric="humidity"
                />
              </View>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}
