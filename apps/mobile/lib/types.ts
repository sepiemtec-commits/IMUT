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
  serialNumber: string | null;
  mqttUsername: string;
  status: string;
  isActive: boolean;
  lastSeenAt: string | null;
  tempMaxCelsius: number;
  humidityMaxPercent: number;
  alertAfterCycles: number;
  createdAt: string;
  latestReading: {
    temperature: number;
    humidity: number;
    recordedAt: string;
  } | null;
}

export interface MqttCredentials {
  broker: string;
  username: string;
  password: string;
  topic: string;
}

export interface CreateDevicePayload {
  name: string;
  environment: string;
  serialNumber?: string;
  mqttPassword: string;
  tempMaxCelsius?: number;
  humidityMaxPercent?: number;
  alertAfterCycles?: number;
}

export interface UpdateDevicePayload {
  name?: string;
  environment?: string;
  serialNumber?: string;
  tempMaxCelsius?: number;
  humidityMaxPercent?: number;
  alertAfterCycles?: number;
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
