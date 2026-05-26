import {
  LIMITS,
  parseTelemetryPayload,
  telemetryTimestampToDate,
  type Esp32Telemetry,
} from "@imut/shared";
import { DeviceStatus, SubscriptionStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { enqueueAnomalyCheck } from "../lib/queues.js";

const ACTIVE_SUBSCRIPTION: SubscriptionStatus[] = [
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.TRIALING,
];

export class TelemetryRejectedError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "TelemetryRejectedError";
  }
}

function parsePayload(buffer: Buffer): Esp32Telemetry {
  let raw: unknown;
  try {
    raw = JSON.parse(buffer.toString("utf8"));
  } catch {
    throw new TelemetryRejectedError("JSON inválido", "INVALID_JSON");
  }
  try {
    return parseTelemetryPayload(raw);
  } catch {
    throw new TelemetryRejectedError(
      "Payload fora do contrato ESP32",
      "INVALID_PAYLOAD",
    );
  }
}

async function assertSubscriptionActive(companyId: string): Promise<void> {
  const sub = await prisma.subscription.findUnique({
    where: { companyId },
  });

  const active =
    sub &&
    ACTIVE_SUBSCRIPTION.includes(sub.status) &&
    (!sub.currentPeriodEnd || sub.currentPeriodEnd > new Date());

  if (!active) {
    throw new TelemetryRejectedError(
      "Assinatura inativa",
      "SUBSCRIPTION_INACTIVE",
    );
  }
}

async function assertReadingInterval(deviceId: string, recordedAt: Date): Promise<void> {
  const last = await prisma.sensorReading.findFirst({
    where: { deviceId },
    orderBy: { recordedAt: "desc" },
    select: { recordedAt: true },
  });

  if (!last) return;

  const elapsedMs = recordedAt.getTime() - last.recordedAt.getTime();
  if (elapsedMs < LIMITS.MIN_READING_INTERVAL_SECONDS * 1000) {
    throw new TelemetryRejectedError(
      `Leitura ignorada: intervalo mínimo ${LIMITS.MIN_READING_INTERVAL_SECONDS}s`,
      "READING_TOO_FREQUENT",
    );
  }
}

export interface IngestResult {
  readingId: string;
  deviceId: string;
  companyId: string;
}

/**
 * Valida dispositivo, assinatura e intervalo; persiste SensorReading no PostgreSQL.
 */
export async function ingestTelemetry(
  payload: Buffer,
  topicCompanyId?: string,
): Promise<IngestResult> {
  const data = parsePayload(payload);
  const recordedAt = telemetryTimestampToDate(data.timestamp);

  if (recordedAt.getTime() > Date.now() + 5 * 60 * 1000) {
    throw new TelemetryRejectedError(
      "Timestamp no futuro",
      "INVALID_TIMESTAMP",
    );
  }

  const device = await prisma.device.findFirst({
    where: { id: data.deviceId, isActive: true },
    include: { company: { include: { subscription: true } } },
  });

  if (!device) {
    throw new TelemetryRejectedError(
      "Dispositivo não encontrado ou inativo",
      "DEVICE_NOT_FOUND",
    );
  }

  if (topicCompanyId && topicCompanyId !== device.companyId) {
    throw new TelemetryRejectedError(
      "companyId do tópico não confere com o dispositivo",
      "TOPIC_MISMATCH",
    );
  }

  await assertSubscriptionActive(device.companyId);
  await assertReadingInterval(device.id, recordedAt);

  const duplicate = await prisma.sensorReading.findFirst({
    where: { deviceId: device.id, recordedAt },
    select: { id: true },
  });
  if (duplicate) {
    throw new TelemetryRejectedError(
      "Leitura duplicada",
      "DUPLICATE_READING",
    );
  }

  const [reading] = await prisma.$transaction([
    prisma.sensorReading.create({
      data: {
        companyId: device.companyId,
        deviceId: device.id,
        environment: data.environment,
        temperature: data.temperature,
        humidity: data.humidity,
        battery: data.battery != null ? Math.round(data.battery) : null,
        recordedAt,
      },
    }),
    prisma.device.update({
      where: { id: device.id },
      data: {
        lastSeenAt: new Date(),
        status: DeviceStatus.ONLINE,
        environment: data.environment,
      },
    }),
  ]);

  logger.info(
    {
      readingId: reading.id,
      deviceId: device.id,
      companyId: device.companyId,
      environment: data.environment,
      temperature: data.temperature,
      humidity: data.humidity,
      recordedAt: recordedAt.toISOString(),
    },
    "SensorReading salva",
  );

  try {
    await enqueueAnomalyCheck(reading.id);
  } catch (err) {
    logger.warn({ err, readingId: reading.id }, "Falha ao enfileirar análise de IA");
  }

  return {
    readingId: reading.id,
    deviceId: device.id,
    companyId: device.companyId,
  };
}
