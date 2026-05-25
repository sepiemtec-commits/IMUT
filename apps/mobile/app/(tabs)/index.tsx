import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useDashboard, useAlerts } from "../../hooks/queries";
import { EnvironmentCard } from "../../components/EnvironmentCard";
import { MetricCard } from "../../components/MetricCard";

export default function DashboardScreen() {
  const { data, isLoading, refetch, isRefetching, dataUpdatedAt } = useDashboard();
  const { data: openAlerts } = useAlerts("OPEN");

  const avgTemp =
    data?.environments.length &&
    data.environments.some((e) => e.temperature != null)
      ? (
          data.environments.reduce((s, e) => s + (e.temperature ?? 0), 0) /
          data.environments.filter((e) => e.temperature != null).length
        ).toFixed(1)
      : "—";

  const avgHum =
    data?.environments.length &&
    data.environments.some((e) => e.humidity != null)
      ? (
          data.environments.reduce((s, e) => s + (e.humidity ?? 0), 0) /
          data.environments.filter((e) => e.humidity != null).length
        ).toFixed(0)
      : "—";

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
      <Text className="text-sm text-slate-500">
        Atualizado{" "}
        {dataUpdatedAt
          ? new Date(dataUpdatedAt).toLocaleTimeString("pt-BR")
          : "—"}{" "}
        · refresh 1 min
      </Text>

      {isLoading ? (
        <ActivityIndicator className="mt-8" color="#0ea5e9" />
      ) : (
        <>
          <View className="mt-4 flex-row gap-3">
            <MetricCard
              label="Temperatura média"
              value={avgTemp}
              unit="°C"
              accent="text-orange-400"
            />
            <MetricCard
              label="Umidade média"
              value={avgHum}
              unit="%"
              accent="text-sky-400"
            />
          </View>

          <View className="mt-3 flex-row gap-3">
            <MetricCard
              label="Alertas ativos"
              value={String(data?.activeAlertsCount ?? openAlerts?.length ?? 0)}
              accent={
                (data?.activeAlertsCount ?? 0) > 0
                  ? "text-red-400"
                  : "text-emerald-400"
              }
            />
            <MetricCard
              label="Sensores"
              value={String(data?.deviceCount ?? 0)}
            />
          </View>

          <Text className="mb-2 mt-6 text-lg font-semibold text-white">
            Status dos ambientes
          </Text>

          {data?.environments.map((env) => (
            <EnvironmentCard key={env.deviceId} env={env} />
          ))}

          {data?.environments.length === 0 && (
            <Text className="text-center text-slate-500">
              Nenhum sensor cadastrado
            </Text>
          )}
        </>
      )}
    </ScrollView>
  );
}
