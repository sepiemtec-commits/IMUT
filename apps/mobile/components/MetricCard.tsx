import { Text, View } from "react-native";

interface MetricCardProps {
  label: string;
  value: string;
  unit?: string;
  accent?: string;
}

export function MetricCard({
  label,
  value,
  unit,
  accent = "text-white",
}: MetricCardProps) {
  return (
    <View className="flex-1 rounded-xl border border-slate-700 bg-slate-800/80 p-4">
      <Text className="text-xs uppercase text-slate-400">{label}</Text>
      <View className="mt-1 flex-row items-baseline">
        <Text className={`text-2xl font-bold ${accent}`}>{value}</Text>
        {unit && <Text className="ml-1 text-sm text-slate-400">{unit}</Text>}
      </View>
    </View>
  );
}
