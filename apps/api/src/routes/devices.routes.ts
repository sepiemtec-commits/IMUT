import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { requireActiveSubscription } from "../middleware/require-subscription.js";
import { requirePermission } from "../middleware/require-permission.js";
import { asyncHandler } from "../lib/async-handler.js";
import { prisma } from "../lib/prisma.js";

export const devicesRouter = Router();

devicesRouter.use(authenticate);
devicesRouter.use(requireActiveSubscription);

devicesRouter.get("/", requirePermission("devices:read"), asyncHandler(async (req, res) => {
  const companyId = req.user!.companyId;

  const devices = await prisma.device.findMany({
    where: { companyId, isActive: true },
    orderBy: { name: "asc" },
    include: {
      sensorReadings: {
        orderBy: { recordedAt: "desc" },
        take: 1,
      },
    },
  });

  res.json({
    devices: devices.map((d) => ({
      id: d.id,
      name: d.name,
      environment: d.environment,
      status: d.status,
      lastSeenAt: d.lastSeenAt,
      tempMaxCelsius: d.tempMaxCelsius,
      humidityMaxPercent: d.humidityMaxPercent,
      latestReading: d.sensorReadings[0]
        ? {
            temperature: d.sensorReadings[0].temperature,
            humidity: d.sensorReadings[0].humidity,
            recordedAt: d.sensorReadings[0].recordedAt,
          }
        : null,
    })),
  });
}));
