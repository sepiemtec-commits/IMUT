import { loadEnvFiles } from "./load-env.js";
import { z } from "zod";

loadEnvFiles();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  API_PORT: z.coerce.number().default(3000),
  API_URL: z.string().url().default("http://localhost:3000"),
  APP_URL: z.string().url().default("http://localhost:8081"),
  CORS_ORIGIN: z.string().default("http://localhost:8081"),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  /** Exige HTTPS em produção (atrás de proxy com X-Forwarded-Proto) */
  FORCE_HTTPS: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  TRUST_PROXY: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_ID_MONTHLY: z.string().optional(),
});

export const env = envSchema.parse(process.env);

export function isProduction(): boolean {
  return env.NODE_ENV === "production";
}

export function mustUseHttps(): boolean {
  return isProduction() || env.FORCE_HTTPS === true;
}

export function isStripeConfigured(): boolean {
  return Boolean(
    env.STRIPE_SECRET_KEY &&
      env.STRIPE_WEBHOOK_SECRET &&
      env.STRIPE_PRICE_ID_MONTHLY,
  );
}
