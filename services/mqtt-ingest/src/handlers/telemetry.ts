import { logger } from "../lib/logger.js";
import {
  ingestTelemetry,
  TelemetryRejectedError,
} from "../services/telemetry.service.js";

/**
 * Tópico: imut/{companyId}/{deviceId}/telemetry
 * Payload JSON com deviceId, temperature, humidity, environment, timestamp.
 */
export async function handleTelemetryMessage(
  topic: string,
  payload: Buffer,
): Promise<void> {
  const parts = topic.split("/").filter(Boolean);
  let topicCompanyId: string | undefined;

  // imut / {companyId} / {deviceId} / telemetry
  if (parts.length >= 4 && parts[parts.length - 1] === "telemetry") {
    topicCompanyId = parts[1];
  }

  try {
    await ingestTelemetry(payload, topicCompanyId);
  } catch (err) {
    if (err instanceof TelemetryRejectedError) {
      if (err.code === "READING_TOO_FREQUENT" || err.code === "DUPLICATE_READING") {
        logger.debug({ topic, code: err.code }, err.message);
        return;
      }
      logger.warn({ topic, code: err.code }, err.message);
      return;
    }
    throw err;
  }
}
