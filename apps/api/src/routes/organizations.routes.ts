import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { requireActiveSubscription } from "../middleware/require-subscription.js";
import { requireCompanyParam } from "../middleware/require-company.js";
import { responsiblesRouter } from "./responsibles.routes.js";
import { requirePermission } from "../middleware/require-permission.js";
import { asyncHandler } from "../lib/async-handler.js";
import { prisma } from "../lib/prisma.js";

export const organizationsRouter = Router();

organizationsRouter.use(authenticate);

/** Detalhe da empresa — requer assinatura ativa */
organizationsRouter.get(
  "/:orgId",
  requireActiveSubscription,
  requireCompanyParam("orgId"),
  requirePermission("dashboard:read"),
  asyncHandler(async (req, res) => {
    const company = await prisma.company.findUnique({
      where: { id: req.params.orgId },
      include: {
        subscription: true,
        _count: { select: { devices: true, responsibles: true } },
      },
    });

    if (!company) {
      return res.status(404).json({ error: "NOT_FOUND" });
    }

    res.json({ company });
  }),
);

organizationsRouter.use(
  "/:orgId/responsibles",
  requireActiveSubscription,
  responsiblesRouter,
);
