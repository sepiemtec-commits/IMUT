import { Router } from "express";
import {
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  registerSchema,
} from "@imut/shared";
import { authenticate } from "../middleware/authenticate.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../lib/async-handler.js";
import { clientIp } from "../services/audit.service.js";
import {
  getMe,
  loginUser,
  logoutUser,
  recordFailedLogin,
  refreshAccessToken,
  registerUser,
} from "../services/auth.service.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const result = await registerUser(req.body);
    res.status(201).json(result);
  }),
);

authRouter.post(
  "/login",
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    try {
      const result = await loginUser(req.body);
      res.json(result);
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "INVALID_CREDENTIALS") {
        await recordFailedLogin(req.body.email, clientIp(req));
      }
      throw err;
    }
  }),
);

authRouter.post(
  "/refresh",
  validateBody(refreshTokenSchema),
  asyncHandler(async (req, res) => {
    const tokens = await refreshAccessToken(req.body.refreshToken);
    res.json(tokens);
  }),
);

authRouter.post(
  "/logout",
  authenticate,
  validateBody(logoutSchema),
  asyncHandler(async (req, res) => {
    await logoutUser(req.user!.sub, req.body.refreshToken);
    res.status(204).send();
  }),
);

authRouter.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const me = await getMe(req.user!.sub);
    if (!me) {
      res.status(404).json({ error: "NOT_FOUND" });
      return;
    }
    res.json(me);
  }),
);
