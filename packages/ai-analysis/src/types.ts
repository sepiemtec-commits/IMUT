/** Ponto de leitura normalizado para análise (independente do Prisma) */
export interface ReadingPoint {
  temperature: number;
  humidity: number;
  environment: string;
  recordedAt: Date;
}

export interface ThresholdConfig {
  /** Limite absoluto de temperatura (°C) */
  tempMaxCelsius: number;
  /** Limite absoluto de umidade (%) */
  humidityMaxPercent: number;
  /** Ciclos consecutivos acima do limite para disparar alerta (padrão: 2 × 4 min) */
  consecutiveCyclesRequired: number;
  /** Janela da média móvel (número de leituras) */
  movingAverageWindow: number;
  /** Desvios padrão acima da média móvel = elevação anormal */
  elevationStdMultiplier: number;
}

export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  tempMaxCelsius: 30,
  humidityMaxPercent: 80,
  consecutiveCyclesRequired: 2,
  movingAverageWindow: 6,
  elevationStdMultiplier: 2,
};

export type TrendDirection = "rising" | "falling" | "stable";

export interface TrendResult {
  slope: number;
  direction: TrendDirection;
  /** Coeficiente angular normalizado por hora quando há timestamps */
  slopePerHour: number;
}

export interface AnomalyStats {
  movingAvgTemperature: number | null;
  movingAvgHumidity: number | null;
  stdTemperature: number | null;
  latestTemperature: number;
  latestHumidity: number;
  temperatureTrend: TrendResult;
  humidityTrend: TrendResult;
  consecutiveAboveTempLimit: number;
  consecutiveAboveHumidityLimit: number;
  abnormalTemperatureElevation: boolean;
  abnormalHumidityElevation: boolean;
}

export type AffectedMetric = "temperature" | "humidity" | "both";

export interface AnomalyEvaluation {
  shouldAlert: boolean;
  environment: string;
  affectedMetric: AffectedMetric | null;
  reason: string;
  stats: AnomalyStats;
}

export interface WeeklyAlertItem {
  environment: string;
  title: string;
  message: string;
  severity: string;
  status: string;
  createdAt: string;
}

export interface EnvironmentWeeklySlice {
  environment: string;
  readingCount: number;
  avgTemperature: number;
  maxTemperature: number;
  minTemperature: number;
  avgHumidity: number;
  maxHumidity: number;
  minHumidity: number;
  temperatureTrend: TrendDirection;
  humidityTrend: TrendDirection;
  alertCount: number;
  anomalyCyclesDetected: number;
}

export interface WeeklyAnalysisResult {
  periodStart: Date;
  periodEnd: Date;
  summary: string;
  metrics: {
    totalReadings: number;
    totalAlerts: number;
    environments: EnvironmentWeeklySlice[];
    globalAvgTemperature: number;
    globalAvgHumidity: number;
    predictedNextTemperature: number | null;
    analysisBackend: "statistical" | "tensorflow";
    alerts: WeeklyAlertItem[];
  };
  insights: string[];
}
