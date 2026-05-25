import type {
  EnvironmentWeeklySlice,
  ReadingPoint,
  TrendDirection,
  WeeklyAlertItem,
  WeeklyAnalysisResult,
} from "../types.js";
import { mean, max, min } from "../statistics/basic.js";
import { linearTrend } from "../statistics/trend.js";
import type { MlPredictor } from "../ml/predictor.js";
import { StatisticalPredictor } from "../ml/statistical-predictor.js";

export interface WeeklyAnalysisInput {
  companyName: string;
  periodStart: Date;
  periodEnd: Date;
  readings: ReadingPoint[];
  alertCount: number;
  alerts?: WeeklyAlertItem[];
  predictor?: MlPredictor;
}

function groupByEnvironment(
  readings: ReadingPoint[],
): Map<string, ReadingPoint[]> {
  const map = new Map<string, ReadingPoint[]>();
  for (const r of readings) {
    const list = map.get(r.environment) ?? [];
    list.push(r);
    map.set(r.environment, list);
  }
  return map;
}

function analyzeEnvironment(
  environment: string,
  points: ReadingPoint[],
  alertCount: number,
): EnvironmentWeeklySlice {
  const sorted = [...points].sort(
    (a, b) => a.recordedAt.getTime() - b.recordedAt.getTime(),
  );
  const temps = sorted.map((p) => p.temperature);
  const hums = sorted.map((p) => p.humidity);
  const times = sorted.map((p) => p.recordedAt.getTime());
  const tempTrend = linearTrend(temps, times);
  const humidityTrend = linearTrend(hums, times);

  return {
    environment,
    readingCount: sorted.length,
    avgTemperature: mean(temps) ?? 0,
    maxTemperature: max(temps) ?? 0,
    minTemperature: min(temps) ?? 0,
    avgHumidity: mean(hums) ?? 0,
    maxHumidity: max(hums) ?? 0,
    minHumidity: min(hums) ?? 0,
    temperatureTrend: tempTrend.direction,
    humidityTrend: humidityTrend.direction,
    alertCount,
    anomalyCyclesDetected: 0,
  };
}

function trendLabel(d: TrendDirection): string {
  if (d === "rising") return "em alta";
  if (d === "falling") return "em queda";
  return "estável";
}

function buildSummary(
  companyName: string,
  periodStart: Date,
  periodEnd: Date,
  slices: EnvironmentWeeklySlice[],
  totalAlerts: number,
  globalAvgTemp: number,
  predictedTemp: number | null,
): string {
  const from = periodStart.toLocaleDateString("pt-BR");
  const to = periodEnd.toLocaleDateString("pt-BR");
  const envLines = slices
    .map(
      (s) =>
        `• ${s.environment}: temp média ${s.avgTemperature.toFixed(1)}°C (máx ${s.maxTemperature.toFixed(1)}°C, tendência ${trendLabel(s.temperatureTrend)}); umidade média ${s.avgHumidity.toFixed(0)}% (tendência ${trendLabel(s.humidityTrend)})`,
    )
    .join("\n");

  const prediction =
    predictedTemp != null
      ? `\nProjeção estatística para próximo ciclo: ~${predictedTemp.toFixed(1)}°C.`
      : "";

  return (
    `Relatório semanal IMUT — ${companyName}\n` +
    `Período: ${from} a ${to}\n\n` +
    `Média geral de temperatura: ${globalAvgTemp.toFixed(1)}°C.\n` +
    `Alertas no período: ${totalAlerts}.\n\n` +
    `Ambientes monitorados:\n${envLines || "—"}` +
    prediction
  );
}

/**
 * Gera análise semanal com estatística simples, média móvel implícita nos agregados
 * e tendência temporal por ambiente.
 */
export async function buildWeeklyAnalysis(
  input: WeeklyAnalysisInput,
): Promise<WeeklyAnalysisResult> {
  const predictor = input.predictor ?? new StatisticalPredictor();
  const groups = groupByEnvironment(input.readings);
  const environments: EnvironmentWeeklySlice[] = [];

  const alerts = input.alerts ?? [];

  for (const [env, points] of groups) {
    const envAlertCount = alerts.filter((a) => a.environment === env).length;
    environments.push(analyzeEnvironment(env, points, envAlertCount));
  }

  const allTemps = input.readings.map((r) => r.temperature);
  const globalAvgTemperature = mean(allTemps) ?? 0;
  const globalAvgHumidity = mean(input.readings.map((r) => r.humidity)) ?? 0;

  const prediction = await predictor.predictTemperature(input.readings);

  const insights: string[] = [];
  for (const s of environments) {
    if (s.maxTemperature > 30) {
      insights.push(
        `${s.environment}: pico de ${s.maxTemperature.toFixed(1)}°C — revisar ventilação ou limiar.`,
      );
    }
    if (s.temperatureTrend === "rising") {
      insights.push(
        `${s.environment}: tendência de alta na temperatura — monitorar próximos ciclos.`,
      );
    }
    if (s.humidityTrend === "rising") {
      insights.push(
        `${s.environment}: tendência de alta na umidade.`,
      );
    }
    if (s.maxHumidity > 80) {
      insights.push(
        `${s.environment}: umidade máxima ${s.maxHumidity.toFixed(0)}% — verificar ventilação.`,
      );
    }
  }

  const summary = buildSummary(
    input.companyName,
    input.periodStart,
    input.periodEnd,
    environments,
    input.alertCount,
    globalAvgTemperature,
    prediction?.predictedNext ?? null,
  );

  return {
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    summary,
    metrics: {
      totalReadings: input.readings.length,
      totalAlerts: input.alertCount,
      environments,
      globalAvgTemperature,
      globalAvgHumidity,
      predictedNextTemperature: prediction?.predictedNext ?? null,
      analysisBackend: predictor.backend,
      alerts,
    },
    insights,
  };
}
