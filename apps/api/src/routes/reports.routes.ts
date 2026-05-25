import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { requireActiveSubscription } from "../middleware/require-subscription.js";
import { requirePermission } from "../middleware/require-permission.js";
import { asyncHandler } from "../lib/async-handler.js";
import { prisma } from "../lib/prisma.js";

export const reportsRouter = Router();

reportsRouter.use(authenticate);
reportsRouter.use(requireActiveSubscription);

reportsRouter.get("/weekly", requirePermission("reports:read"), asyncHandler(async (req, res) => {
  const companyId = req.user!.companyId;
  const limit = Math.min(Number(req.query.limit) || 12, 52);

  const reports = await prisma.weeklyReport.findMany({
    where: { companyId },
    orderBy: { periodEnd: "desc" },
    take: limit,
    select: {
      id: true,
      periodStart: true,
      periodEnd: true,
      summary: true,
      metrics: true,
      emailedAt: true,
      pdfPath: true,
      createdAt: true,
    },
  });

  res.json({
    reports: reports.map((r) => ({
      ...r,
      hasPdf: Boolean(r.pdfPath),
    })),
  });
}));

reportsRouter.get("/weekly/:id", requirePermission("reports:read"), asyncHandler(async (req, res) => {
  const companyId = req.user!.companyId;
  const report = await prisma.weeklyReport.findFirst({
    where: { id: req.params.id, companyId },
  });

  if (!report) {
    return res.status(404).json({ error: "NOT_FOUND" });
  }

  res.json({ report });
}));
