import type { NextFunction, Request, Response } from "express";
import { recordAuditFromRequest } from "../services/audit.service.js";

const SENSITIVE_PATHS = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"];

function shouldAudit(req: Request, statusCode: number): boolean {
  if (SENSITIVE_PATHS.some((p) => req.path.endsWith(p))) return true;
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return true;
  if (statusCode >= 400) return true;
  return false;
}

function actionFromRequest(req: Request, statusCode: number): string {
  const base = req.path.replace(/^\/v1/, "").replace(/\//g, "_").replace(/^_/, "");
  if (req.path.includes("/auth/login")) {
    return statusCode < 400 ? "AUTH_LOGIN" : "AUTH_LOGIN_FAILED";
  }
  if (req.path.includes("/auth/register")) return "AUTH_REGISTER";
  if (req.path.includes("/auth/refresh")) return "AUTH_REFRESH";
  if (req.path.includes("/auth/logout")) return "AUTH_LOGOUT";
  return `${req.method}_${base || "root"}`.toUpperCase().slice(0, 64);
}

/** Registra logs de auditoria após resposta (ações sensíveis e mutações) */
export function auditMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  res.on("finish", () => {
    if (!shouldAudit(req, res.statusCode)) return;

    void recordAuditFromRequest(req, actionFromRequest(req, res.statusCode), {
      success: res.statusCode < 400,
      statusCode: res.statusCode,
      resource: req.baseUrl || undefined,
    });
  });

  next();
}
