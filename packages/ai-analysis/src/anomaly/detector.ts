import type {
  AnomalyEvaluation,
  AnomalyStats,
  AffectedMetric,
  ReadingPoint,
  ThresholdConfig,
} from "../types.js";
import { DEFAULT_THRESHOLDS } from "../types.js";
import {
  countTrailingAbove,
  mean,
  standardDeviation,
} from "../statistics/basic.js";
import { lastMovingAverage } from "../statistics/moving-average.js";
import { linearTrend } from "../statistics/trend.js";

function sortByTime(points: ReadingPoint[]): ReadingPoint[] {
  return [...points].sort(
    (a, b) => a.recordedAt.getTime() - b.recordedAt.getTime(),
  );
}

function buildStats(
  sorted: ReadingPoint[],
  thresholds: ThresholdConfig,
): AnomalyStats {
  const temps = sorted.map((p) => p.temperature);
  const hums = sorted.map((p) => p.humidity);
  const times = sorted.map((p) => p.recordedAt.getTime());
  const latest = sorted[sorted.length - 1]!;
  const window = thresholds.movingAverageWindow;
  const history = sorted.slice(0, -1);
  const histTemps = history.map((p) => p.temperature);

  const movingAvgTemperature = lastMovingAverage(histTemps, window);
  const movingAvgHumidity = lastMovingAverage(
    history.map((p) => p.humidity),
    window,
  );
  const stdTemperature = standardDeviation(histTemps);

  let abnormalTemperatureElevation = false;
  if (
    movingAvgTemperature != null &&
    stdTemperature != null &&
    stdTemperature > 0
  ) {
    const threshold =
      movingAvgTemperature +
      thresholds.elevationStdMultiplier * stdTemperature;
    abnormalTemperatureElevation = latest.temperature > threshold;
  }

  let abnormalHumidityElevation = false;
  const histHums = history.map((p) => p.humidity);
  const stdHumidity = standardDeviation(histHums);
  if (movingAvgHumidity != null && stdHumidity != null && stdHumidity > 0) {
    const threshold =
      movingAvgHumidity + thresholds.elevationStdMultiplier * stdHumidity;
    abnormalHumidityElevation = latest.humidity > threshold;
  }

  return {
    movingAvgTemperature,
    movingAvgHumidity,
    stdTemperature,
    latestTemperature: latest.temperature,
    latestHumidity: latest.humidity,
    temperatureTrend: linearTrend(temps, times),
    humidityTrend: linearTrend(hums, times),
    consecutiveAboveTempLimit: countTrailingAbove(
      temps,
      thresholds.tempMaxCelsius,
    ),
    consecutiveAboveHumidityLimit: countTrailingAbove(
      hums,
      thresholds.humidityMaxPercent,
    ),
    abnormalTemperatureElevation,
    abnormalHumidityElevation,
  };
}

function resolveAffectedMetric(
  stats: AnomalyStats,
  thresholds: ThresholdConfig,
): AffectedMetric | null {
  const tempAlert =
    stats.consecutiveAboveTempLimit >= thresholds.consecutiveCyclesRequired ||
    stats.abnormalTemperatureElevation;
  const humAlert =
    stats.consecutiveAboveHumidityLimit >=
      thresholds.consecutiveCyclesRequired ||
    stats.abnormalHumidityElevation;

  if (tempAlert && humAlert) return "both";
  if (tempAlert) return "temperature";
  if (humAlert) return "humidity";
  return null;
}

function buildReason(
  metric: AffectedMetric,
  stats: AnomalyStats,
  thresholds: ThresholdConfig,
  environment: string,
): string {
  const parts: string[] = [`Ambiente afetado: ${environment}.`];

  if (metric === "temperature" || metric === "both") {
    if (
      stats.consecutiveAboveTempLimit >= thresholds.consecutiveCyclesRequired
    ) {
      parts.push(
        `Temperatura acima de ${thresholds.tempMaxCelsius}°C por ${stats.consecutiveAboveTempLimit} ciclos consecutivos (limite: ${thresholds.consecutiveCyclesRequired}).`,
      );
    }
    if (stats.abnormalTemperatureElevation) {
      parts.push(
        `Elevação anormal de temperatura (${stats.latestTemperature.toFixed(1)}°C vs média móvel ${stats.movingAvgTemperature?.toFixed(1) ?? "—"}°C).`,
      );
    }
  }

  if (metric === "humidity" || metric === "both") {
    if (
      stats.consecutiveAboveHumidityLimit >=
      thresholds.consecutiveCyclesRequired
    ) {
      parts.push(
        `Umidade acima de ${thresholds.humidityMaxPercent}% por ${stats.consecutiveAboveHumidityLimit} ciclos consecutivos.`,
      );
    }
    if (stats.abnormalHumidityElevation) {
      parts.push(
        `Elevação anormal de umidade (${stats.latestHumidity.toFixed(0)}%).`,
      );
    }
  }

  const trend = stats.temperatureTrend.direction;
  if (trend === "rising") {
    parts.push("Tendência temporal de temperatura em alta.");
  }

  return parts.join(" ");
}

/**
 * Compara últimas leituras, aplica média móvel e tendência;
 * dispara alerta após N ciclos consecutivos acima do limite ou elevação anormal.
 */
export function evaluateAnomaly(
  readings: ReadingPoint[],
  thresholds: ThresholdConfig = DEFAULT_THRESHOLDS,
): AnomalyEvaluation {
  const environment = readings[readings.length - 1]?.environment ?? "Desconhecido";

  if (readings.length < thresholds.consecutiveCyclesRequired) {
    return {
      shouldAlert: false,
      environment,
      affectedMetric: null,
      reason: "Leituras insuficientes para análise",
      stats: emptyStats(readings),
    };
  }

  const sorted = sortByTime(readings);
  const stats = buildStats(sorted, thresholds);
  const affectedMetric = resolveAffectedMetric(stats, thresholds);

  const shouldAlert = affectedMetric !== null;
  const reason = shouldAlert
    ? buildReason(affectedMetric, stats, thresholds, environment)
    : "Parâmetros dentro dos limites";

  return {
    shouldAlert,
    environment,
    affectedMetric,
    reason,
    stats,
  };
}

function emptyStats(readings: ReadingPoint[]): AnomalyStats {
  const latest = readings[readings.length - 1];
  return {
    movingAvgTemperature: null,
    movingAvgHumidity: null,
    stdTemperature: null,
    latestTemperature: latest?.temperature ?? 0,
    latestHumidity: latest?.humidity ?? 0,
    temperatureTrend: { slope: 0, direction: "stable", slopePerHour: 0 },
    humidityTrend: { slope: 0, direction: "stable", slopePerHour: 0 },
    consecutiveAboveTempLimit: 0,
    consecutiveAboveHumidityLimit: 0,
    abnormalTemperatureElevation: false,
    abnormalHumidityElevation: false,
  };
}
