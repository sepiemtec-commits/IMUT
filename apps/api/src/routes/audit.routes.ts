import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/authenticate.js";
import { requireActiveSubscription } from "../middleware/require-subscription.js";
import { requirePermission } from "../middleware/require-permission.js";
import { validateQuery } from "../middleware/validate.js";
import { asyncHandler } from "../lib/async-handler.js";
import { prisma } from "../lib/prisma.js";

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  action: z.string().max(64).optional(),
});

export const auditRouter = Router();

auditRouter.use(authenticate);
auditRouter.use(requireActiveSubscription);
auditRouter.use(requirePermission("audit:read"));

auditRouter.get(
  "/",
  validateQuery(listQuerySchema),
  asyncHandler(async (req, res) => {
    const companyId = req.user!.companyId;
    const { limit, action } = req.query as unknown as z.infer<typeof listQuerySchema>;

    const logs = await prisma.auditLog.findMany({
      where: {
        companyId,
        ...(action ? { action } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        action: true,
        userId: true,
        resource: true,
        resourceId: true,
        method: true,
        path: true,
        ip: true,
        statusCode: true,
        success: true,
        createdAt: true,
      },
    });

    res.json({ logs });
  }),
);
