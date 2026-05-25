import type { ReadingPoint, ThresholdConfig } from "@imut/ai-analysis";
import type { Device, SensorReading } from "@prisma/client";

export function toReadingPoint(reading: {
  temperature: number;
  humidity: number;
  environment: string;
  recordedAt: Date;
}): ReadingPoint {
  return {
    temperature: reading.temperature,
    humidity: reading.humidity,
    environment: reading.environment,
    recordedAt: reading.recordedAt,
  };
}

export function deviceThresholds(device: Device): ThresholdConfig {
  return {
    tempMaxCelsius: device.tempMaxCelsius,
    humidityMaxPercent: device.humidityMaxPercent,
    consecutiveCyclesRequired: device.alertAfterCycles,
    movingAverageWindow: 6,
    elevationStdMultiplier: 2,
  };
}

export function mapReadings(readings: SensorReading[]): ReadingPoint[] {
  return readings.map((r) => toReadingPoint(r));
}
