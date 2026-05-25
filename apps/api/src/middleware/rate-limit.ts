import rateLimit from "express-rate-limit";

/** Login / register — anti brute-force */
export const authStrictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "RATE_LIMIT_AUTH",
    message: "Muitas tentativas de autenticação. Tente novamente em 15 minutos.",
  },
  skipSuccessfulRequests: false,
});

/** Refresh token */
export const authRefreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "RATE_LIMIT_REFRESH" },
});

/** API autenticada geral */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "RATE_LIMIT",
    message: "Limite de requisições excedido",
  },
});

/** Webhooks (Stripe) */
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
