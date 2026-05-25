import { dispatchAlertNotifications } from "../services/alert-notification.service.js";

export interface DispatchAlertJobData {
  alertId: string;
}

/** Job BullMQ: e-mail + push FCM em paralelo */
export async function dispatchAlert(data: DispatchAlertJobData): Promise<void> {
  await dispatchAlertNotifications(data.alertId);
}
