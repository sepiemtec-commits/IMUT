import { dispatchAlertNotifications } from "../services/alert-notification.service.js";

export interface SendAlertEmailJobData {
  alertId: string;
}

/** @deprecated Preferir DISPATCH_ALERT — mantido para compatibilidade */
export async function sendAlertEmailJob(data: SendAlertEmailJobData): Promise<void> {
  await dispatchAlertNotifications(data.alertId);
}
