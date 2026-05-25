/** Limites do produto IMUT */
export const LIMITS = {
  MAX_DEVICES_PER_ORG: 10,
  MAX_RESPONSIBLES_PER_ORG: 5,
  MEASUREMENT_INTERVAL_SECONDS: 240,
  MIN_READING_INTERVAL_SECONDS: 180,
} as const;

export const MQTT_TOPIC_PREFIX = "imut";

export const QUEUES = {
  TELEMETRY: "telemetry",
  ALERTS: "alerts",
  NOTIFICATIONS: "notifications",
  REPORTS: "reports",
  AI: "ai",
} as const;

export const JOBS = {
  PROCESS_READING: "process-reading",
  EVALUATE_ANOMALY: "evaluate-anomaly",
  /** E-mail + push FCM após alerta criado */
  DISPATCH_ALERT: "dispatch-alert",
  SEND_ALERT_EMAIL: "send-alert-email",
  SEND_ALERT_PUSH: "send-alert-push",
  WEEKLY_REPORT: "weekly-report",
  ANALYZE_ENVIRONMENT: "analyze-environment",
} as const;
