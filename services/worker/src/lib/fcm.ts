import { readFileSync } from "node:fs";
import admin from "firebase-admin";
import type { MulticastMessage } from "firebase-admin/messaging";
import { env, isFcmConfigured } from "../config/env.js";
import pino from "pino";

const logger = pino({ name: "fcm" });

let initialized = false;

function initFirebase(): boolean {
  if (initialized) return true;
  if (!isFcmConfigured()) return false;

  if (admin.apps.length > 0) {
    initialized = true;
    return true;
  }

  try {
    if (env.FCM_SERVICE_ACCOUNT_PATH) {
      const raw = readFileSync(env.FCM_SERVICE_ACCOUNT_PATH, "utf8");
      const serviceAccount = JSON.parse(raw) as admin.ServiceAccount;
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: env.FCM_PROJECT_ID!,
          clientEmail: env.FCM_CLIENT_EMAIL!,
          privateKey: env.FCM_PRIVATE_KEY!.replace(/\\n/g, "\n"),
        }),
      });
    }
    initialized = true;
    return true;
  } catch (err) {
    logger.error({ err }, "Falha ao inicializar Firebase Admin");
    return false;
  }
}

export interface AlertPushPayload {
  tokens: string[];
  alertId: string;
  companyId: string;
  environment: string;
  title: string;
  body: string;
  severity: string;
}

export interface PushSendResult {
  successCount: number;
  failureCount: number;
  failedTokens: string[];
}

export async function sendAlertPush(
  payload: AlertPushPayload,
): Promise<PushSendResult | null> {
  if (payload.tokens.length === 0) {
    return { successCount: 0, failureCount: 0, failedTokens: [] };
  }

  if (!initFirebase()) {
    logger.warn("FCM não configurado — push ignorado");
    return null;
  }

  const messaging = admin.messaging();
  const failedTokens: string[] = [];
  let successCount = 0;
  let failureCount = 0;

  const batchSize = 500;
  for (let i = 0; i < payload.tokens.length; i += batchSize) {
    const chunk = payload.tokens.slice(i, i + batchSize);
    const message: MulticastMessage = {
      notification: {
        title: payload.title,
        body: `Ambiente: ${payload.environment}`,
      },
      data: {
        type: "alert",
        alertId: payload.alertId,
        companyId: payload.companyId,
        environment: payload.environment,
        severity: payload.severity,
      },
      android: {
        priority: "high",
        notification: { channelId: "imut_alerts" },
      },
      apns: {
        payload: { aps: { sound: "default", badge: 1 } },
      },
      tokens: chunk,
    };

    const response = await messaging.sendEachForMulticast(message);
    successCount += response.successCount;
    failureCount += response.failureCount;

    response.responses.forEach((res, idx) => {
      if (!res.success) {
        failedTokens.push(chunk[idx]!);
        logger.debug(
          { error: res.error?.message, token: chunk[idx]?.slice(0, 12) },
          "FCM falhou para token",
        );
      }
    });
  }

  return { successCount, failureCount, failedTokens };
}
