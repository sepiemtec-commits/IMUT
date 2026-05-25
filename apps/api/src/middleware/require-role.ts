import type { NextFunction, Request, Response } from "express";
import type { Role } from "@imut/shared";

export function requireRole(...allowed: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role || !allowed.includes(role)) {
      return res.status(403).json({
        error: "FORBIDDEN",
        message: "Permissão insuficiente",
      });
    }
    next();
  };
}
