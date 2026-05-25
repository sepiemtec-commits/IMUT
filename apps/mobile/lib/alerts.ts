import { apiFetch } from "./api";

export type AlertSeverity = "INFO" | "WARNING" | "CRITICAL";
export type AlertStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED";

export interface AlertItem {
  id: string;
  environment: string;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  message: string;
  device?: { id: string; name: string; environment: string } | null;
  emailSentAt: string | null;
  pushSentAt: string | null;
  createdAt: string;
}

export async function fetchAlerts(
  token: string,
  params?: { status?: AlertStatus },
): Promise<AlertItem[]> {
  const qs = params?.status ? `?status=${params.status}` : "";
  const data = await apiFetch<{ alerts: AlertItem[] }>(`/alerts${qs}`, { token });
  return data.alerts;
}

export async function acknowledgeAlert(
  token: string,
  alertId: string,
): Promise<void> {
  await apiFetch(`/alerts/${alertId}/acknowledge`, {
    method: "PATCH",
    token,
  });
}
