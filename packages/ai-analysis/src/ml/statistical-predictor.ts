import type { ReadingPoint } from "../types.js";
import type { MlPredictor, TemperaturePrediction } from "./predictor.js";
import { linearTrend } from "../statistics/trend.js";

/** Predição por extrapolação da tendência linear (substituível por TensorFlow) */
export class StatisticalPredictor implements MlPredictor {
  readonly backend = "statistical" as const;

  async predictTemperature(
    readings: ReadingPoint[],
  ): Promise<TemperaturePrediction | null> {
    if (readings.length < 3) return null;

    const sorted = [...readings].sort(
      (a, b) => a.recordedAt.getTime() - b.recordedAt.getTime(),
    );
    const temps = sorted.map((r) => r.temperature);
    const times = sorted.map((r) => r.recordedAt.getTime());
    const trend = linearTrend(temps, times);
    const last = sorted[sorted.length - 1]!;
    const lastHour = last.recordedAt.getTime() / 3_600_000;
    const nextHour = lastHour + 4 / 60;
    const predictedNext = last.temperature + trend.slope * (nextHour - lastHour);

    const confidence = Math.min(0.95, 0.5 + readings.length * 0.05);

    return {
      predictedNext: Math.round(predictedNext * 10) / 10,
      confidence,
      method: "statistical",
    };
  }
}
