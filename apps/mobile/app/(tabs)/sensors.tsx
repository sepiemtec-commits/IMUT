import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useDevices, useReadings } from "../../hooks/queries";
import { TelemetryChart } from "../../components/TelemetryChart";
import { StatusBadge } from "../../components/StatusBadge";
import type { EnvironmentStatus } from "../../lib/types";

function deviceStatus(lastSeen: string | null): EnvironmentStatus {
  if (!lastSeen) return "offline";
  const diff = Date.now() - new Date(lastSeen).getTime();
  return diff > 20 * 60 * 1000 ? "offline" : "ok";
}

export default function SensorsScreen() {
  const { data: devices, isLoading, refetch, isRefetching } = useDevices();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeId = selectedId ?? devices?.[0]?.id ?? null;
  const { data: readings, isLoading: loadingChart } = useReadings(
    activeId ?? "",
    24,
  );

  const selected = devices?.find((d) => d.id === activeId);

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
      <Text className="text-slate-400">
        Temperatura e umidade em tempo real (atualização a cada 4 min)
      </Text>

      {isLoading ? (
        <ActivityIndicator className="mt-8" color="#0ea5e9" />
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
                <View>
                  <Text className="font-semibold text-white">{device.name}</Text>
                  <Text className="text-sm text-imut-primary">
                    {device.environment}
                  </Text>
                </View>
                <StatusBadge status={deviceStatus(device.lastSeenAt)} />
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
                    {new Date(device.latestReading.recordedAt).toLocaleTimeString(
                      "pt-BR",
                    )}
                  </Text>
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
              <View className="mt-4">
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
