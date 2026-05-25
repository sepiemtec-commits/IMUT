import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "../lib/logger.js";

interface AppError extends Error {
  code?: string;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      details: err.flatten(),
    });
  }

  const code = err.code;

  if (code === "EMAIL_EXISTS") {
    return res.status(409).json({ error: code, message: err.message });
  }
  if (code === "INVALID_CREDENTIALS" || code === "INVALID_REFRESH") {
    return res.status(401).json({ error: code, message: err.message });
  }
  if (err.message?.includes("TokenExpired") || code === "TOKEN_EXPIRED") {
    return res.status(401).json({ error: "TOKEN_EXPIRED" });
  }
  if (code === "STRIPE_NOT_CONFIGURED") {
    return res.status(503).json({ error: code, message: err.message });
  }
  if (code === "NO_STRIPE_CUSTOMER") {
    return res.status(400).json({ error: code, message: err.message });
  }

  logger.error(err);
  res.status(500).json({ error: "INTERNAL_ERROR", message: "Erro interno" });
}
