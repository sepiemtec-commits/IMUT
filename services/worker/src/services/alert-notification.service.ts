import {
  NotificationChannel,
  NotificationDeliveryStatus,
} from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { sendAlertEmail } from "../lib/email.js";
import { sendAlertPush } from "../lib/fcm.js";
import pino from "pino";

const logger = pino({ name: "alert-notifications" });

interface AlertWithRelations {
  id: string;
  companyId: string;
  environment: string;
  title: string;
  message: string;
  severity: string;
  metadata: unknown;
  company: {
    name: string;
    owner: { email: string; id: string } | null;
    responsibles: { email: string; name: string; userId: string | null }[];
  };
}

function extractMetrics(metadata: unknown): {
  temperature?: number;
  humidity?: number;
} {
  if (!metadata || typeof metadata !== "object") return {};
  const stats = (metadata as { stats?: { latestTemperature?: number; latestHumidity?: number } })
    .stats;
  return {
    temperature: stats?.latestTemperature,
    humidity: stats?.latestHumidity,
  };
}

async function loadAlert(alertId: string): Promise<AlertWithRelations | null> {
  const alert = await prisma.alert.findUnique({
    where: { id: alertId },
    include: {
      company: {
        include: {
          owner: { select: { id: true, email: true } },
          responsibles: {
            where: { isActive: true },
            select: { email: true, name: true, userId: true },
          },
        },
      },
    },
  });
  return alert as AlertWithRelations | null;
}

async function collectUserIds(alert: AlertWithRelations): Promise<string[]> {
  const ids = new Set<string>();
  if (alert.company.owner?.id) ids.add(alert.company.owner.id);
  for (const r of alert.company.responsibles) {
    if (r.userId) ids.add(r.userId);
  }
  return [...ids];
}

async function logNotification(
  alertId: string,
  channel: NotificationChannel,
  status: NotificationDeliveryStatus,
  recipient: string | null,
  externalId?: string | null,
  error?: string | null,
): Promise<void> {
  await prisma.alertNotification.create({
    data: {
      alertId,
      channel,
      status,
      recipient,
      externalId: externalId ?? undefined,
      error: error ?? undefined,
      sentAt: status === NotificationDeliveryStatus.SENT ? new Date() : undefined,
    },
  });
}

async function sendEmails(alert: AlertWithRelations): Promise<boolean> {
  const emails = new Set<string>();
  if (alert.company.owner?.email) emails.add(alert.company.owner.email);
  for (const r of alert.company.responsibles) {
    emails.add(r.email);
  }

  if (emails.size === 0) {
    await logNotification(
      alert.id,
      NotificationChannel.EMAIL,
      NotificationDeliveryStatus.SKIPPED,
      null,
      null,
      "Nenhum destinatário",
    );
    return false;
  }

  const metrics = extractMetrics(alert.metadata);
  const subject = `[IMUT] ${alert.title}`;
  let anySent = false;

  for (const to of emails) {
    try {
      const result = await sendAlertEmail({
        to,
        subject,
        environment: alert.environment,
        title: alert.title,
        message: alert.message,
        severity: alert.severity,
        temperature: metrics.temperature,
        humidity: metrics.humidity,
      });

      if (result) {
        anySent = true;
        await logNotification(
          alert.id,
          NotificationChannel.EMAIL,
          NotificationDeliveryStatus.SENT,
          to,
          result.messageId,
        );
      } else {
        await logNotification(
          alert.id,
          NotificationChannel.EMAIL,
          NotificationDeliveryStatus.SKIPPED,
          to,
          null,
          "SMTP não configurado",
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await logNotification(
        alert.id,
        NotificationChannel.EMAIL,
        NotificationDeliveryStatus.FAILED,
        to,
        null,
        msg,
      );
      logger.error({ err, to, alertId: alert.id }, "Falha ao enviar e-mail");
    }
  }

  return anySent;
}

async function sendPushNotifications(alert: AlertWithRelations): Promise<boolean> {
  const userIds = await collectUserIds(alert);
  if (userIds.length === 0) {
    await logNotification(
      alert.id,
      NotificationChannel.PUSH,
      NotificationDeliveryStatus.SKIPPED,
      null,
      null,
      "Nenhum usuário com app",
    );
    return false;
  }

  const tokens = await prisma.pushToken.findMany({
    where: { userId: { in: userIds } },
    select: { token: true, userId: true },
  });

  if (tokens.length === 0) {
    await logNotification(
      alert.id,
      NotificationChannel.PUSH,
      NotificationDeliveryStatus.SKIPPED,
      null,
      null,
      "Nenhum token FCM registrado",
    );
    return false;
  }

  const metrics = extractMetrics(alert.metadata);
  const body =
    metrics.temperature != null
      ? `${alert.message.slice(0, 120)} · ${metrics.temperature.toFixed(1)}°C`
      : alert.message.slice(0, 180);

  try {
    const result = await sendAlertPush({
      tokens: tokens.map((t) => t.token),
      alertId: alert.id,
      companyId: alert.companyId,
      environment: alert.environment,
      title: alert.title,
      body,
      severity: alert.severity,
    });

    if (!result) {
      await logNotification(
        alert.id,
        NotificationChannel.PUSH,
        NotificationDeliveryStatus.SKIPPED,
        `${tokens.length} tokens`,
        null,
        "FCM não configurado",
      );
      return false;
    }

    if (result.failedTokens.length > 0) {
      await prisma.pushToken.deleteMany({
        where: { token: { in: result.failedTokens } },
      });
    }

    const status =
      result.successCount > 0
        ? NotificationDeliveryStatus.SENT
        : NotificationDeliveryStatus.FAILED;

    await logNotification(
      alert.id,
      NotificationChannel.PUSH,
      status,
      `${result.successCount}/${tokens.length} dispositivos`,
      undefined,
      result.failureCount > 0 ? `${result.failureCount} falhas` : null,
    );

    return result.successCount > 0;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logNotification(
      alert.id,
      NotificationChannel.PUSH,
      NotificationDeliveryStatus.FAILED,
      `${tokens.length} tokens`,
      null,
      msg,
    );
    logger.error({ err, alertId: alert.id }, "Falha ao enviar push FCM");
    return false;
  }
}

/**
 * Dispara e-mail (Nodemailer) e push (FCM) para o alerta; registra entregas no banco.
 */
export async function dispatchAlertNotifications(alertId: string): Promise<void> {
  const alert = await loadAlert(alertId);
  if (!alert) {
    logger.warn({ alertId }, "Alerta não encontrado");
    return;
  }

  const [emailOk, pushOk] = await Promise.all([
    sendEmails(alert),
    sendPushNotifications(alert),
  ]);

  await prisma.alert.update({
    where: { id: alertId },
    data: {
      emailSentAt: emailOk ? new Date() : undefined,
      pushSentAt: pushOk ? new Date() : undefined,
    },
  });

  logger.info(
    {
      alertId,
      environment: alert.environment,
      emailOk,
      pushOk,
    },
    "Notificações de alerta processadas",
  );
}
