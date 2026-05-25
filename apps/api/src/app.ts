import cors from "cors";
import express from "express";
import pinoHttp from "pino-http";
import { env, isProduction } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { errorHandler } from "./middleware/error-handler.js";
import { requireHttps } from "./middleware/require-https.js";
import { securityHelmet } from "./middleware/security-headers.js";
import {
  apiLimiter,
  authRefreshLimiter,
  authStrictLimiter,
  webhookLimiter,
} from "./middleware/rate-limit.js";
import { auditMiddleware } from "./middleware/audit.js";
import { authRouter } from "./routes/auth.routes.js";
import { billingRouter } from "./routes/billing.routes.js";
import { healthRouter } from "./routes/health.routes.js";
import { organizationsRouter } from "./routes/organizations.routes.js";
import { alertsRouter } from "./routes/alerts.routes.js";
import { pushTokensRouter } from "./routes/push-tokens.routes.js";
import { dashboardRouter } from "./routes/dashboard.routes.js";
import { devicesRouter } from "./routes/devices.routes.js";
import { readingsRouter } from "./routes/readings.routes.js";
import { reportsRouter } from "./routes/reports.routes.js";
import { auditRouter } from "./routes/audit.routes.js";
import { stripeWebhookRouter } from "./routes/stripe-webhook.routes.js";

export function createApp() {
  const app = express();

  if (env.TRUST_PROXY) {
    app.set("trust proxy", 1);
  }

  app.use(requireHttps);
  app.use(securityHelmet);
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );
  app.use(
    pinoHttp({
      logger,
      redact: {
        paths: [
          "req.headers.authorization",
          "req.body.password",
          "req.body.refreshToken",
        ],
        remove: true,
      },
      autoLogging: isProduction(),
    }),
  );

  app.use("/health", healthRouter);

  app.use(
    "/webhooks/stripe",
    webhookLimiter,
    express.raw({ type: "application/json", limit: "1mb" }),
    stripeWebhookRouter,
  );

  app.use(express.json({ limit: "1mb" }));

  const v1 = express.Router();
  v1.use(auditMiddleware);

  v1.use("/auth/login", authStrictLimiter);
  v1.use("/auth/register", authStrictLimiter);
  v1.use("/auth/refresh", authRefreshLimiter);
  v1.use("/auth", authRouter);

  v1.use(apiLimiter);
  v1.use("/billing", billingRouter);
  v1.use("/organizations", organizationsRouter);
  v1.use("/alerts", alertsRouter);
  v1.use("/dashboard", dashboardRouter);
  v1.use("/devices", devicesRouter);
  v1.use("/readings", readingsRouter);
  v1.use("/reports", reportsRouter);
  v1.use("/push-tokens", pushTokensRouter);
  v1.use("/audit-logs", auditRouter);

  app.use("/v1", v1);

  app.use(errorHandler);

  return app;
}
