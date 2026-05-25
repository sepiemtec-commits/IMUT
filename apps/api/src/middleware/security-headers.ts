import helmet from "helmet";
import { isProduction } from "../config/env.js";

export const securityHelmet = helmet({
  contentSecurityPolicy: isProduction()
    ? {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:"],
          connectSrc: ["'self'"],
        },
      }
    : false,
  crossOriginEmbedderPolicy: false,
  hsts: isProduction()
    ? {
        maxAge: 31_536_000,
        includeSubDomains: true,
        preload: true,
      }
    : false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  frameguard: { action: "deny" },
  noSniff: true,
});
