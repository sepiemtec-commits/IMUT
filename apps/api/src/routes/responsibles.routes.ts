import { Router } from "express";
import { z } from "zod";
import { LIMITS } from "@imut/shared";
import { UserRole } from "@prisma/client";
import { authenticate } from "../middleware/authenticate.js";
import { requireActiveSubscription } from "../middleware/require-subscription.js";
import { requirePermission } from "../middleware/require-permission.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../lib/async-handler.js";
import { requireCompanyParam } from "../middleware/require-company.js";
import { prisma } from "../lib/prisma.js";

export const responsiblesRouter = Router({ mergeParams: true });

responsiblesRouter.use(authenticate);
responsiblesRouter.use(requireActiveSubscription);
responsiblesRouter.use(requireCompanyParam("orgId"));

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.enum(["ADMIN", "VIEWER"]).default("VIEWER"),
});

responsiblesRouter.get(
  "/",
  requirePermission("responsibles:read"),
  asyncHandler(async (req, res) => {
  const companyId = req.user!.companyId;
  const list = await prisma.responsible.findMany({
    where: { companyId, isActive: true },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      userId: true,
      createdAt: true,
    },
  });
    res.json({
      responsibles: list,
      limit: LIMITS.MAX_RESPONSIBLES_PER_ORG,
      count: list.length,
    });
  }),
);

responsiblesRouter.post(
  "/",
  requirePermission("responsibles:write"),
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
      const companyId = req.user!.companyId;
      const data = req.body as z.infer<typeof createSchema>;

      const count = await prisma.responsible.count({
        where: { companyId, isActive: true },
      });

      if (count >= LIMITS.MAX_RESPONSIBLES_PER_ORG) {
        return res.status(409).json({
          error: "MEMBER_LIMIT",
          message: `Máximo de ${LIMITS.MAX_RESPONSIBLES_PER_ORG} responsáveis por empresa`,
        });
      }

      const responsible = await prisma.responsible.create({
        data: {
          companyId,
          name: data.name,
          email: data.email,
          phone: data.phone,
          role: data.role as UserRole,
        },
      });

      res.status(201).json({ responsible });
  }),
);

responsiblesRouter.delete(
  "/:id",
  requirePermission("responsibles:delete"),
  asyncHandler(async (req, res) => {
    const companyId = req.user!.companyId;
    const updated = await prisma.responsible.updateMany({
      where: { id: req.params.id, companyId },
      data: { isActive: false },
    });

    if (updated.count === 0) {
      return res.status(404).json({ error: "NOT_FOUND" });
    }

    res.status(204).send();
  }),
);
