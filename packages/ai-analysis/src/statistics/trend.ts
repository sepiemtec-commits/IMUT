import type { TrendDirection, TrendResult } from "../types.js";

const STABLE_SLOPE_THRESHOLD = 0.05;

function directionFromSlope(slopePerHour: number): TrendDirection {
  if (slopePerHour > STABLE_SLOPE_THRESHOLD) return "rising";
  if (slopePerHour < -STABLE_SLOPE_THRESHOLD) return "falling";
  return "stable";
}

/**
 * Regressão linear mínimos quadrados.
 * Com timestamps (ms), slope é normalizado para °C ou % por hora.
 */
export function linearTrend(
  values: number[],
  timestampsMs?: number[],
): TrendResult {
  const n = values.length;
  if (n < 2) {
    return { slope: 0, direction: "stable", slopePerHour: 0 };
  }

  const xs =
    timestampsMs && timestampsMs.length === n
      ? timestampsMs.map((t) => t / 3_600_000)
      : values.map((_, i) => i);

  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = values.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i]! - xMean) * (values[i]! - yMean);
    den += (xs[i]! - xMean) ** 2;
  }

  const slope = den === 0 ? 0 : num / den;
  const slopePerHour =
    timestampsMs && timestampsMs.length === n ? slope : slope * (60 / 4);

  return {
    slope,
    slopePerHour,
    direction: directionFromSlope(slopePerHour),
  };
}
