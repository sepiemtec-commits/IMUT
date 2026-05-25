import { Text, View } from "react-native";
import type { DashboardEnvironment } from "../lib/types";
import { StatusBadge } from "./StatusBadge";

export function EnvironmentCard({ env }: { env: DashboardEnvironment }) {
  return (
    <View className="mb-3 rounded-xl border border-slate-700 bg-slate-800/80 p-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-semibold text-white">{env.environment}</Text>
        <StatusBadge status={env.status} />
      </View>
      <Text className="mt-1 text-xs text-slate-500">{env.deviceName}</Text>
      <View className="mt-3 flex-row gap-4">
        <View>
          <Text className="text-xs text-slate-400">Temperatura</Text>
          <Text className="text-xl font-bold text-orange-400">
            {env.temperature != null ? `${env.temperature.toFixed(1)}°C` : "—"}
          </Text>
        </View>
        <View>
          <Text className="text-xs text-slate-400">Umidade</Text>
          <Text className="text-xl font-bold text-sky-400">
            {env.humidity != null ? `${env.humidity.toFixed(0)}%` : "—"}
          </Text>
        </View>
      </View>
    </View>
  );
}
