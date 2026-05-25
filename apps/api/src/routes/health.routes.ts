import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { redis } from "../lib/redis.js";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res) => {
  let db = "ok";
  let redisStatus = "ok";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    db = "error";
  }

  try {
    await redis.ping();
  } catch {
    redisStatus = "error";
  }

  const ok = db === "ok" && redisStatus === "ok";
  res.status(ok ? 200 : 503).json({
    status: ok ? "ok" : "degraded",
    db,
    redis: redisStatus,
  });
});
