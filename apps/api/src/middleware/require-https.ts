import type { NextFunction, Request, Response } from "express";
import { mustUseHttps } from "../config/env.js";

/**
 * Bloqueia requisições HTTP em produção (HTTPS obrigatório).
 * Requer `trust proxy` quando atrás de Nginx/ALB.
 */
export function requireHttps(req: Request, res: Response, next: NextFunction) {
  if (!mustUseHttps()) {
    return next();
  }

  const proto =
    req.headers["x-forwarded-proto"]?.toString().split(",")[0]?.trim() ??
    (req.secure ? "https" : "http");

  if (proto === "https") {
    return next();
  }

  return res.status(403).json({
    error: "HTTPS_REQUIRED",
    message: "Conexão segura (HTTPS) é obrigatória",
  });
}
