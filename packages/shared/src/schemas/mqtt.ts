import { z } from "zod";

/** Payload enviado pelo ESP32 a cada 4 minutos */
export const esp32TelemetrySchema = z.object({
  deviceId: z.string().min(1),
  temperature: z.number().min(-40).max(125),
  humidity: z.number().min(0).max(100),
  environment: z.string().min(1).max(120),
  /** Unix seconds (UTC) ou ISO 8601 */
  timestamp: z.union([
    z.number().int().positive(),
    z.string().min(1),
  ]),
  battery: z.number().min(0).max(100).optional(),
});

/** Variante legada (temp / ts) — normalizada no ingest */
export const esp32TelemetryLegacySchema = z.object({
  deviceId: z.string().min(1),
  temp: z.number().min(-40).max(125),
  humidity: z.number().min(0).max(100),
  environment: z.string().min(1).max(120),
  ts: z.number().int().positive(),
  battery: z.number().min(0).max(100).optional(),
});

export type Esp32Telemetry = z.infer<typeof esp32TelemetrySchema>;

export function parseTelemetryPayload(raw: unknown): Esp32Telemetry {
  const legacy = esp32TelemetryLegacySchema.safeParse(raw);
  if (legacy.success) {
    return {
      deviceId: legacy.data.deviceId,
      temperature: legacy.data.temp,
      humidity: legacy.data.humidity,
      environment: legacy.data.environment,
      timestamp: legacy.data.ts,
      battery: legacy.data.battery,
    };
  }
  return esp32TelemetrySchema.parse(raw);
}

export function telemetryTimestampToDate(timestamp: Esp32Telemetry["timestamp"]): Date {
  if (typeof timestamp === "number") {
    return new Date(timestamp * 1000);
  }
  const parsed = Date.parse(timestamp);
  if (Number.isNaN(parsed)) {
    throw new Error("timestamp inválido");
  }
  return new Date(parsed);
}

/** @deprecated use esp32TelemetrySchema */
export const telemetryPayloadSchema = z.object({
  temp: z.number().min(-40).max(125),
  humidity: z.number().min(0).max(100),
  ts: z.number().int().positive(),
  battery: z.number().min(0).max(100).optional(),
});

export type TelemetryPayloadInput = z.infer<typeof telemetryPayloadSchema>;
