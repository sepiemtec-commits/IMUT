import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "@imut/shared";
import { env } from "../config/env.js";
import { resolveAuthContext } from "../lib/auth-context.js";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Valida JWT access token e reidrata role/companyId do banco (RBAC atualizado).
 */
async function authenticateHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }

  try {
    const token = header.slice(7);
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;

    const ctx = await resolveAuthContext(decoded.sub);
    if (!ctx) {
      return res.status(401).json({ error: "UNAUTHORIZED" });
    }

    req.user = {
      sub: ctx.userId,
      companyId: ctx.companyId,
      role: ctx.role,
    };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: "TOKEN_EXPIRED" });
    }
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }
}

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  void authenticateHandler(req, res, next).catch(next);
}
