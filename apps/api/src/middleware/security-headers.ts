import helmet from "helmet";
import { isProduction } from "../config/env.js";

export const securityHelmet = helmet({
  // CSP ativo em produção e desenvolvimento
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline necessário para Expo Web
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "https://*.hivemq.cloud", "wss://*.hivemq.cloud"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],       // bloqueia Flash e plugins
      frameAncestors: ["'none'"],  // equivale ao X-Frame-Options: DENY
      baseUri: ["'self'"],         // previne base tag injection
      formAction: ["'self'"],      // previne form hijacking
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: isProduction()
    ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
    : false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  frameguard: { action: "deny" },
  noSniff: true,                   // X-Content-Type-Options: nosniff
  xssFilter: true,                 // X-XSS-Protection: 1; mode=block
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
});
