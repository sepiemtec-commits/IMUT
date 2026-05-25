import { Pressable, Text, View } from "react-native";
import type { AlertItem } from "../lib/types";

const SEVERITY: Record<string, string> = {
  CRITICAL: "text-red-400",
  WARNING: "text-amber-400",
  INFO: "text-sky-400",
};

export function AlertCard({
  alert,
  onAck,
}: {
  alert: AlertItem;
  onAck?: () => void;
}) {
  return (
    <View className="mb-3 rounded-xl border border-slate-700 bg-slate-800/80 p-4">
      <View className="flex-row justify-between">
        <Text className="text-xs font-medium uppercase text-imut-primary">
          {alert.environment}
        </Text>
        <Text className={`text-xs font-bold ${SEVERITY[alert.severity]}`}>
          {alert.severity}
        </Text>
      </View>
      <Text className="mt-2 text-base font-medium text-white">{alert.title}</Text>
      <Text className="mt-1 text-sm text-slate-400">{alert.message}</Text>
      {alert.status === "OPEN" && onAck && (
        <Pressable onPress={onAck} className="mt-3 self-start rounded-lg bg-slate-700 px-4 py-2">
          <Text className="text-sm text-white">Reconhecer</Text>
        </Pressable>
      )}
    </View>
  );
}
