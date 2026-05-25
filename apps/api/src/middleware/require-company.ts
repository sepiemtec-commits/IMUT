import type { NextFunction, Request, Response } from "express";

/** Garante que :companyId ou :orgId pertence ao JWT */
export function requireCompanyParam(
  paramName: "companyId" | "orgId" = "companyId",
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const paramId = req.params[paramName] ?? req.params.companyId ?? req.params.orgId;
    if (!paramId || paramId !== req.user?.companyId) {
      return res.status(403).json({ error: "FORBIDDEN" });
    }
    next();
  };
}
