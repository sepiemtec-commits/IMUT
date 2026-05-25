import { Router } from "express";
import { AlertStatus, DeviceStatus } from "@prisma/client";
import { authenticate } from "../middleware/authenticate.js";
import { requireActiveSubscription } from "../middleware/require-subscription.js";
import { requirePermission } from "../middleware/require-permission.js";
import { asyncHandler } from "../lib/async-handler.js";
import { prisma } from "../lib/prisma.js";

export const dashboardRouter = Router();

dashboardRouter.use(authenticate);
dashboardRouter.use(requireActiveSubscription);

dashboardRouter.get("/", requirePermission("dashboard:read"), asyncHandler(async (req, res) => {
  const companyId = req.user!.companyId;

  const devices = await prisma.device.findMany({
    where: { companyId, isActive: true },
    orderBy: { environment: "asc" },
  });

  const openAlerts = await prisma.alert.findMany({
    where: { companyId, status: AlertStatus.OPEN },
    select: { environment: true, severity: true },
  });

  const alertEnvironments = new Set(openAlerts.map((a) => a.environment));

  const environments = await Promise.all(
    devices.map(async (device) => {
      const latest = await prisma.sensorReading.findFirst({
        where: { deviceId: device.id },
        orderBy: { recordedAt: "desc" },
      });

      const offlineThreshold = new Date(Date.now() - 20 * 60 * 1000);
      const isOffline =
        !device.lastSeenAt || device.lastSeenAt < offlineThreshold;

      let status: "ok" | "alert" | "offline" = "ok";
      if (isOffline || device.status === DeviceStatus.OFFLINE) {
        status = "offline";
      } else if (alertEnvironments.has(device.environment)) {
        status = "alert";
      }

      return {
        deviceId: device.id,
        deviceName: device.name,
        environment: device.environment,
        temperature: latest?.temperature ?? null,
        humidity: latest?.humidity ?? null,
        recordedAt: latest?.recordedAt ?? null,
        status,
      };
    }),
  );

  res.json({
    environments,
    activeAlertsCount: openAlerts.length,
    deviceCount: devices.length,
    updatedAt: new Date().toISOString(),
  });
}));
