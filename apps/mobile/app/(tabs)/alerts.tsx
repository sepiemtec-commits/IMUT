import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useAlerts, useAcknowledgeAlert } from "../../hooks/queries";
import { AlertCard } from "../../components/AlertCard";

export default function AlertsScreen() {
  const { data, isLoading, refetch, isRefetching } = useAlerts("OPEN");
  const ack = useAcknowledgeAlert();

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
        Alertas ativos por ambiente — 2 ciclos acima do limite
      </Text>

      {isLoading ? (
        <ActivityIndicator color="#0ea5e9" />
      ) : data?.length ? (
        data.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onAck={() => ack.mutate(alert.id)}
          />
        ))
      ) : (
        <View className="items-center rounded-xl border border-slate-700 py-12">
          <Text className="text-emerald-400">Nenhum alerta ativo</Text>
        </View>
      )}
    </ScrollView>
  );
}
