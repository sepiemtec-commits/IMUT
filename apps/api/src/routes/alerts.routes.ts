import { Router } from "express";
import { AlertStatus } from "@prisma/client";
import { authenticate } from "../middleware/authenticate.js";
import { requireActiveSubscription } from "../middleware/require-subscription.js";
import { requirePermission } from "../middleware/require-permission.js";
import { asyncHandler } from "../lib/async-handler.js";
import { prisma } from "../lib/prisma.js";

export const alertsRouter = Router();

alertsRouter.use(authenticate);
alertsRouter.use(requireActiveSubscription);

/** Lista alertas da empresa — ambiente, severidade, status */
alertsRouter.get("/", requirePermission("alerts:read"), asyncHandler(async (req, res) => {
  const companyId = req.user!.companyId;
  const status = req.query.status as AlertStatus | undefined;
  const environment = req.query.environment as string | undefined;
  const limit = Math.min(Number(req.query.limit) || 50, 100);

  const alerts = await prisma.alert.findMany({
    where: {
      companyId,
      ...(status ? { status } : {}),
      ...(environment ? { environment } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      device: { select: { id: true, name: true, environment: true } },
      notifications: {
        select: { channel: true, status: true, sentAt: true },
      },
    },
  });

  res.json({
    alerts: alerts.map((a) => ({
      id: a.id,
      environment: a.environment,
      severity: a.severity,
      status: a.status,
      title: a.title,
      message: a.message,
      device: a.device,
      emailSentAt: a.emailSentAt,
      pushSentAt: a.pushSentAt,
      notifications: a.notifications,
      createdAt: a.createdAt,
      acknowledgedAt: a.acknowledgedAt,
    })),
  });
}));

alertsRouter.get("/:id", requirePermission("alerts:read"), asyncHandler(async (req, res) => {
  const companyId = req.user!.companyId;
  const alert = await prisma.alert.findFirst({
    where: { id: req.params.id, companyId },
    include: {
      device: true,
      notifications: true,
    },
  });

  if (!alert) {
    return res.status(404).json({ error: "NOT_FOUND" });
  }

  res.json({ alert });
}));

alertsRouter.patch("/:id/acknowledge", requirePermission("alerts:acknowledge"), asyncHandler(async (req, res) => {
  const companyId = req.user!.companyId;
  const updated = await prisma.alert.updateMany({
    where: { id: req.params.id, companyId, status: AlertStatus.OPEN },
    data: {
      status: AlertStatus.ACKNOWLEDGED,
      acknowledgedAt: new Date(),
    },
  });

  if (updated.count === 0) {
    return res.status(404).json({ error: "NOT_FOUND" });
  }

  const alert = await prisma.alert.findUnique({ where: { id: req.params.id } });
  res.json({ alert });
}));
