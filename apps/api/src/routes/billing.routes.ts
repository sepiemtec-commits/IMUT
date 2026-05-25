import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { requirePermission } from "../middleware/require-permission.js";
import { asyncHandler } from "../lib/async-handler.js";
import {
  createBillingPortalSession,
  createCheckoutSession,
} from "../services/billing.service.js";
import { prisma } from "../lib/prisma.js";

/** Checkout e Portal — não exigem assinatura ativa (para assinar/regularizar) */
export const billingRouter = Router();

billingRouter.use(authenticate);

billingRouter.post(
  "/checkout",
  requirePermission("billing:manage"),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      select: { email: true },
    });
    if (!user) {
      res.status(404).json({ error: "NOT_FOUND" });
      return;
    }
    const session = await createCheckoutSession(req.user!.companyId, user.email);
    res.json(session);
  }),
);

billingRouter.post(
  "/portal",
  requirePermission("billing:manage"),
  asyncHandler(async (req, res) => {
    const session = await createBillingPortalSession(req.user!.companyId);
    res.json(session);
  }),
);

billingRouter.get(
  "/status",
  requirePermission("billing:read"),
  asyncHandler(async (req, res) => {
    const sub = await prisma.subscription.findUnique({
      where: { companyId: req.user!.companyId },
    });
    res.json({
      subscription: sub ?? { status: "INCOMPLETE" },
      requiresPayment:
        !sub || !["ACTIVE", "TRIALING"].includes(sub.status),
    });
  }),
);
