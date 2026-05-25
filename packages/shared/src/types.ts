export type Role = "OWNER" | "ADMIN" | "VIEWER";

export type SubscriptionStatus =
  | "ACTIVE"
  | "TRIALING"
  | "PAST_DUE"
  | "CANCELED"
  | "INCOMPLETE"
  | "UNPAID";

export type AlertSeverity = "INFO" | "WARNING" | "CRITICAL";

export type AlertStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED";

export interface TelemetryPayload {
  temp: number;
  humidity: number;
  ts: number;
  battery?: number;
}

export interface JwtPayload {
  sub: string;
  companyId: string;
  role: Role;
}
