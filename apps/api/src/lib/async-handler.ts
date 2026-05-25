import type { NextFunction, Request, RequestHandler, Response } from "express";

/** Envolve handlers async para Express capturar rejeições */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
  return (req, res, next) => {
    void fn(req, res, next).catch(next);
  };
}
