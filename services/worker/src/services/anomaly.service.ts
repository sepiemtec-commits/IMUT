import {
  evaluateAnomaly,
  type AnomalyEvaluation,
} from "@imut/ai-analysis";
import { AlertSeverity, AiInsightType } from "@prisma/client";
import { JOBS } from "@imut/shared";
import { prisma } from "../lib/prisma.js";
import { deviceThresholds, mapReadings } from "../lib/mappers.js";
import { notificationsQueue } from "../lib/queues.js";
import pino from "pino";

const logger = pino({ name: "anomaly-service" });

const HISTORY_LIMIT = 12;

export async function runAnomalyAnalysisForReading(
  readingId: string,
): Promise<AnomalyEvaluation | null> {
  const reading = await prisma.sensorReading.findUnique({
    where: { id: readingId },
    include: { device: true },
  });

  if (!reading?.device?.isActive) return null;

  const history = await prisma.sensorReading.findMany({
    where: { deviceId: reading.deviceId },
    orderBy: { recordedAt: "asc" },
    take: HISTORY_LIMIT,
  });

  const points = mapReadings(history);
  const thresholds = deviceThresholds(reading.device);
  const evaluation = evaluateAnomaly(points, thresholds);

  await prisma.aiInsight.create({
    data: {
      companyId: reading.companyId,
      deviceId: reading.deviceId,
      environment: evaluation.environment,
      type: AiInsightType.ANOMALY,
      narrative: evaluation.reason,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      payload: {
        shouldAlert: evaluation.shouldAlert,
        affectedMetric: evaluation.affectedMetric,
        stats: evaluation.stats,
        readingId,
      } as any,
    },
  });

  if (!evaluation.shouldAlert || !evaluation.affectedMetric) {
    logger.debug({ readingId }, "Sem alerta neste ciclo");
    return evaluation;
  }

  const existingOpen = await prisma.alert.findFirst({
    where: {
      companyId: reading.companyId,
      deviceId: reading.deviceId,
      environment: evaluation.environment,
      status: "OPEN",
    },
  });

  if (existingOpen) {
    logger.info({ alertId: existingOpen.id }, "Alerta OPEN já existe");
    return evaluation;
  }

  const severity =
    evaluation.affectedMetric === "both" ||
    evaluation.stats.latestTemperature >
      thresholds.tempMaxCelsius + 5
      ? AlertSeverity.CRITICAL
      : AlertSeverity.WARNING;

  const title =
    evaluation.affectedMetric === "humidity"
      ? `Umidade elevada — ${evaluation.environment}`
      : evaluation.affectedMetric === "temperature"
        ? `Temperatura elevada — ${evaluation.environment}`
        : `Temperatura e umidade elevadas — ${evaluation.environment}`;

  const alert = await prisma.alert.create({
    data: {
      companyId: reading.companyId,
      deviceId: reading.deviceId,
      environment: evaluation.environment,
      severity,
      title,
      message: evaluation.reason,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      metadata: {
        affectedMetric: evaluation.affectedMetric,
        stats: evaluation.stats,
        thresholds,
        readingId,
      } as any,
    },
  });

  await notificationsQueue.add(
    JOBS.DISPATCH_ALERT,
    { alertId: alert.id },
    {
      attempts: 5,
      backoff: { type: "exponential", delay: 3000 },
      removeOnComplete: 500,
    },
  );

  logger.warn({ alertId: alert.id, environment: evaluation.environment }, title);

  return evaluation;
}
