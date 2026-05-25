import { Router } from "express";
import { PushPlatform } from "@prisma/client";
import { z } from "zod";
import { authenticate } from "../middleware/authenticate.js";
import { requirePermission } from "../middleware/require-permission.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../lib/async-handler.js";
import { prisma } from "../lib/prisma.js";

export const pushTokensRouter = Router();

const registerSchema = z.object({
  token: z.string().min(10),
  platform: z.enum(["IOS", "ANDROID", "WEB"]),
});

pushTokensRouter.use(authenticate);

/** Registra token FCM do dispositivo para push de alertas */
pushTokensRouter.post(
  "/",
  requirePermission("push:write"),
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
  const userId = req.user!.sub;
  const { token, platform } = req.body;

  const record = await prisma.pushToken.upsert({
    where: { token },
    create: {
      userId,
      token,
      platform: platform as PushPlatform,
    },
    update: {
      userId,
      platform: platform as PushPlatform,
      updatedAt: new Date(),
    },
  });

  res.status(201).json({ pushToken: { id: record.id, platform: record.platform } });
}));

pushTokensRouter.delete(
  "/",
  requirePermission("push:write"),
  validateBody(z.object({ token: z.string().min(10) })),
  asyncHandler(async (req, res) => {
  const { token } = req.body;

  await prisma.pushToken.deleteMany({
    where: { token, userId: req.user!.sub },
  });

  res.status(204).send();
}));
