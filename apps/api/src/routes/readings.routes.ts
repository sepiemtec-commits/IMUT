import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { requireActiveSubscription } from "../middleware/require-subscription.js";
import { requirePermission } from "../middleware/require-permission.js";
import { asyncHandler } from "../lib/async-handler.js";
import { prisma } from "../lib/prisma.js";

export const readingsRouter = Router();

readingsRouter.use(authenticate);
readingsRouter.use(requireActiveSubscription);

readingsRouter.get("/", requirePermission("devices:read"), asyncHandler(async (req, res) => {
  const companyId = req.user!.companyId;
  const deviceId = req.query.deviceId as string | undefined;
  const hours = Math.min(Number(req.query.hours) || 24, 168);
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const readings = await prisma.sensorReading.findMany({
    where: {
      companyId,
      ...(deviceId ? { deviceId } : {}),
      recordedAt: { gte: since },
    },
    orderBy: { recordedAt: "asc" },
    take: 500,
    select: {
      id: true,
      deviceId: true,
      environment: true,
      temperature: true,
      humidity: true,
      recordedAt: true,
    },
  });

  res.json({ readings });
}));
