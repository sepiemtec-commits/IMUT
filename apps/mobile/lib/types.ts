export type EnvironmentStatus = "ok" | "alert" | "offline";

export interface DashboardEnvironment {
  deviceId: string;
  deviceName: string;
  environment: string;
  temperature: number | null;
  humidity: number | null;
  recordedAt: string | null;
  status: EnvironmentStatus;
}

export interface DashboardData {
  environments: DashboardEnvironment[];
  activeAlertsCount: number;
  deviceCount: number;
  updatedAt: string;
}

export interface DeviceItem {
  id: string;
  name: string;
  environment: string;
  status: string;
  lastSeenAt: string | null;
  tempMaxCelsius: number;
  humidityMaxPercent: number;
  latestReading: {
    temperature: number;
    humidity: number;
    recordedAt: string;
  } | null;
}

export interface ReadingPoint {
  id: string;
  deviceId: string;
  environment: string;
  temperature: number;
  humidity: number;
  recordedAt: string;
}

export interface AlertItem {
  id: string;
  environment: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
  title: string;
  message: string;
  createdAt: string;
  device?: { id: string; name: string; environment: string } | null;
}

export interface WeeklyReportItem {
  id: string;
  periodStart: string;
  periodEnd: string;
  summary: string;
  metrics: unknown;
  createdAt: string;
}
