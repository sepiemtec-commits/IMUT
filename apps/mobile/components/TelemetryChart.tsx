import { ActivityIndicator, Text, useWindowDimensions, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import type { ReadingPoint } from "../lib/types";

interface TelemetryChartProps {
  readings: ReadingPoint[];
  loading?: boolean;
  metric: "temperature" | "humidity";
}

export function TelemetryChart({
  readings,
  loading,
  metric,
}: TelemetryChartProps) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.min(width - 48, 340);

  if (loading) {
    return (
      <View className="h-48 items-center justify-center">
        <ActivityIndicator color="#0ea5e9" />
      </View>
    );
  }

  if (readings.length < 2) {
    return (
      <View className="h-48 items-center justify-center rounded-xl border border-slate-700">
        <Text className="text-slate-500">Dados insuficientes para gráfico</Text>
      </View>
    );
  }

  const data = readings.map((r, i) => ({
    value: metric === "temperature" ? r.temperature : r.humidity,
    label: i % Math.ceil(readings.length / 4) === 0 ? formatTime(r.recordedAt) : "",
  }));

  const color = metric === "temperature" ? "#f97316" : "#0ea5e9";
  const maxVal = Math.max(...data.map((d) => d.value));
  const minVal = Math.min(...data.map((d) => d.value));

  return (
    <View className="rounded-xl border border-slate-700 bg-slate-800/50 p-2">
      <Text className="mb-2 px-2 text-sm text-slate-400">
        {metric === "temperature" ? "Temperatura (°C)" : "Umidade (%)"} — 24h
      </Text>
      <LineChart
        data={data}
        color={color}
        thickness={2}
        hideDataPoints={readings.length > 20}
        curved
        areaChart
        startFillColor={color}
        endFillColor={color}
        startOpacity={0.2}
        endOpacity={0.02}
        yAxisColor="#475569"
        xAxisColor="#475569"
        rulesColor="#334155"
        yAxisTextStyle={{ color: "#94a3b8", fontSize: 10 }}
        xAxisLabelTextStyle={{ color: "#94a3b8", fontSize: 9 }}
        maxValue={maxVal + (maxVal - minVal) * 0.1 + 1}
        yAxisLabelWidth={36}
        noOfSections={4}
        width={chartWidth}
        height={160}
        spacing={Math.max(8, chartWidth / data.length)}
      />
    </View>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}
