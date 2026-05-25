import type { NextFunction, Request, Response } from "express";
import type { Permission } from "@imut/shared";
import { hasPermission } from "../lib/rbac.js";

export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role || !hasPermission(role, permission)) {
      return res.status(403).json({
        error: "FORBIDDEN",
        message: "Permissão insuficiente para esta operação",
        permission,
      });
    }
    next();
  };
}
