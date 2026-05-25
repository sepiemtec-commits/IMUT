import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { isSubscriptionActive } from "../services/subscription.service.js";

/**
 * Acesso apenas após pagamento: ACTIVE ou TRIALING.
 * Bloqueia inadimplentes (PAST_DUE, UNPAID, CANCELED, INCOMPLETE).
 */
async function requireActiveSubscriptionHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const companyId = req.user?.companyId;
  if (!companyId) {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }

  const sub = await prisma.subscription.findUnique({
    where: { companyId },
  });

  if (!sub || !isSubscriptionActive(sub.status, sub.currentPeriodEnd)) {
    return res.status(402).json({
      error: "SUBSCRIPTION_REQUIRED",
      message:
        "Assinatura inativa ou inadimplente. Conclua o pagamento ou atualize o método de cobrança.",
      status: sub?.status ?? "INCOMPLETE",
    });
  }

  next();
}

export function requireActiveSubscription(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  void requireActiveSubscriptionHandler(req, res, next).catch(next);
}
