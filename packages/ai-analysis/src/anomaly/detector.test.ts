import { describe, expect, it } from "vitest";
import { evaluateAnomaly } from "./detector.js";
import type { ReadingPoint, ThresholdConfig } from "../types.js";

const thresholds: ThresholdConfig = {
  tempMaxCelsius: 25,
  humidityMaxPercent: 70,
  consecutiveCyclesRequired: 2,
  movingAverageWindow: 3,
  elevationStdMultiplier: 2,
};

function point(temp: number, hum = 50, minOffset = 0): ReadingPoint {
  return {
    temperature: temp,
    humidity: hum,
    environment: "Câmara fria",
    recordedAt: new Date(Date.now() + minOffset * 240_000),
  };
}

describe("evaluateAnomaly", () => {
  it("dispara alerta após 2 ciclos consecutivos acima do limite de temperatura", () => {
    const readings = [
      point(22, 50, 0),
      point(23, 50, 1),
      point(26, 50, 2),
      point(27, 50, 3),
    ];
    const result = evaluateAnomaly(readings, thresholds);
    expect(result.shouldAlert).toBe(true);
    expect(result.affectedMetric).toBe("temperature");
    expect(result.environment).toBe("Câmara fria");
    expect(result.stats.consecutiveAboveTempLimit).toBeGreaterThanOrEqual(2);
  });

  it("não dispara com uma única leitura acima do limite", () => {
    const readings = [point(22), point(23), point(26)];
    const result = evaluateAnomaly(readings, thresholds);
    expect(result.shouldAlert).toBe(false);
  });

  it("identifica ambiente afetado na mensagem", () => {
    const readings = [point(22), point(24), point(28), point(29)];
    const result = evaluateAnomaly(readings, thresholds);
    expect(result.reason).toContain("Câmara fria");
  });
});
