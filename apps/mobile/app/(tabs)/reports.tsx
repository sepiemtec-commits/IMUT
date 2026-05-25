import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useWeeklyReports } from "../../hooks/queries";

export default function ReportsScreen() {
  const { data, isLoading, refetch, isRefetching } = useWeeklyReports();

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
      <Text className="mb-4 text-slate-400">
        Análise semanal automática de temperatura e umidade
      </Text>

      {isLoading ? (
        <ActivityIndicator color="#0ea5e9" />
      ) : data?.length ? (
        data.map((report) => (
          <View
            key={report.id}
            className="mb-4 rounded-xl border border-slate-700 bg-slate-800/80 p-4"
          >
            <Text className="text-sm text-imut-primary">
              {new Date(report.periodStart).toLocaleDateString("pt-BR")} —{" "}
              {new Date(report.periodEnd).toLocaleDateString("pt-BR")}
            </Text>
            <Text className="mt-3 text-sm leading-5 text-slate-300">
              {report.summary}
            </Text>
          </View>
        ))
      ) : (
        <View className="items-center rounded-xl border border-slate-700 py-12">
          <Text className="text-slate-500">Nenhum relatório gerado ainda</Text>
        </View>
      )}
    </ScrollView>
  );
}
