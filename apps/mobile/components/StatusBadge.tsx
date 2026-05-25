import { Text, View } from "react-native";
import type { EnvironmentStatus } from "../lib/types";

const CONFIG: Record<
  EnvironmentStatus,
  { label: string; bg: string; text: string }
> = {
  ok: { label: "Normal", bg: "bg-emerald-900/50", text: "text-emerald-400" },
  alert: { label: "Alerta", bg: "bg-red-900/50", text: "text-red-400" },
  offline: { label: "Offline", bg: "bg-slate-700", text: "text-slate-400" },
};

export function StatusBadge({ status }: { status: EnvironmentStatus }) {
  const c = CONFIG[status];
  return (
    <View className={`rounded-full px-2 py-0.5 ${c.bg}`}>
      <Text className={`text-xs font-medium ${c.text}`}>{c.label}</Text>
    </View>
  );
}
