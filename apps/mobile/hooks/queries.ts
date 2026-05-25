import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import type {
  AlertItem,
  CreateDevicePayload,
  DashboardData,
  DeviceItem,
  MqttCredentials,
  ReadingPoint,
  UpdateDevicePayload,
  WeeklyReportItem,
} from "../lib/types";
import { useAuthStore } from "../store/auth.store";

export const queryKeys = {
  dashboard: ["dashboard"] as const,
  devices: ["devices"] as const,
  readings: (deviceId: string, hours: number) =>
    ["readings", deviceId, hours] as const,
  alerts: (status?: string) => ["alerts", status] as const,
  reports: ["reports", "weekly"] as const,
  billing: ["billing", "status"] as const,
  me: ["me"] as const,
};

const REFETCH_MS = 60_000;

export function useDashboard() {
  const token = useAuthStore((s) => s.accessToken)!;
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => apiFetch<DashboardData>("/dashboard", { token }),
    enabled: Boolean(token),
    refetchInterval: REFETCH_MS,
  });
}

export function useDevices() {
  const token = useAuthStore((s) => s.accessToken)!;
  return useQuery({
    queryKey: queryKeys.devices,
    queryFn: async () => {
      const data = await apiFetch<{ devices: DeviceItem[] }>("/devices", {
        token,
      });
      return data.devices;
    },
    enabled: Boolean(token),
    refetchInterval: REFETCH_MS,
  });
}

export function useReadings(deviceId: string, hours = 24) {
  const token = useAuthStore((s) => s.accessToken)!;
  return useQuery({
    queryKey: queryKeys.readings(deviceId, hours),
    queryFn: async () => {
      const data = await apiFetch<{ readings: ReadingPoint[] }>(
        `/readings?deviceId=${deviceId}&hours=${hours}`,
        { token },
      );
      return data.readings;
    },
    enabled: Boolean(token && deviceId),
    refetchInterval: REFETCH_MS,
  });
}

export function useAlerts(status?: "OPEN" | "ACKNOWLEDGED" | "RESOLVED") {
  const token = useAuthStore((s) => s.accessToken)!;
  const qs = status ? `?status=${status}` : "";
  return useQuery({
    queryKey: queryKeys.alerts(status),
    queryFn: async () => {
      const data = await apiFetch<{ alerts: AlertItem[] }>(`/alerts${qs}`, {
        token,
      });
      return data.alerts;
    },
    enabled: Boolean(token),
    refetchInterval: REFETCH_MS,
  });
}

export function useWeeklyReports() {
  const token = useAuthStore((s) => s.accessToken)!;
  return useQuery({
    queryKey: queryKeys.reports,
    queryFn: async () => {
      const data = await apiFetch<{ reports: WeeklyReportItem[] }>(
        "/reports/weekly",
        { token },
      );
      return data.reports;
    },
    enabled: Boolean(token),
  });
}

export function useMe() {
  const token = useAuthStore((s) => s.accessToken)!;
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () =>
      apiFetch<{
        user: { id: string; email: string; name: string; phone?: string };
        company: { id: string; name: string; slug: string };
        role: string;
        subscription: { status: string; currentPeriodEnd?: string } | null;
        limits: { maxResponsibles: number; responsiblesUsed: number };
      }>("/auth/me", { token }),
    enabled: Boolean(token),
  });
}

export function useBillingStatus() {
  const token = useAuthStore((s) => s.accessToken)!;
  return useQuery({
    queryKey: queryKeys.billing,
    queryFn: () =>
      apiFetch<{
        subscription: { status: string; currentPeriodEnd?: string };
        requiresPayment: boolean;
      }>("/billing/status", { token }),
    enabled: Boolean(token),
  });
}

export function useCreateDevice() {
  const token = useAuthStore((s) => s.accessToken)!;
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDevicePayload) =>
      apiFetch<{ device: DeviceItem; mqttCredentials: MqttCredentials }>("/devices", {
        method: "POST",
        token,
        body: JSON.stringify(payload),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.devices }),
  });
}

export function useUpdateDevice() {
  const token = useAuthStore((s) => s.accessToken)!;
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateDevicePayload & { id: string }) =>
      apiFetch<{ device: DeviceItem }>(`/devices/${id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify(payload),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.devices }),
  });
}

export function useDeleteDevice() {
  const token = useAuthStore((s) => s.accessToken)!;
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/devices/${id}`, { method: "DELETE", token }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.devices }),
  });
}

export function useAcknowledgeAlert() {
  const token = useAuthStore((s) => s.accessToken)!;
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (alertId: string) =>
      apiFetch(`/alerts/${alertId}/acknowledge`, {
        method: "PATCH",
        token,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["alerts"] });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}
