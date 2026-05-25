import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Senha deve ter no mínimo 8 caracteres")
  .max(128)
  .regex(/[A-Z]/, "Senha deve conter letra maiúscula")
  .regex(/[a-z]/, "Senha deve conter letra minúscula")
  .regex(/[0-9]/, "Senha deve conter número");

export const registerSchema = z.object({
  email: z.string().email().max(255).toLowerCase().trim(),
  password: passwordSchema,
  name: z.string().min(2).max(120).trim(),
  organizationName: z.string().min(2).max(120).trim(),
});

export const loginSchema = z.object({
  email: z.string().email().max(255).toLowerCase().trim(),
  password: z.string().min(1).max(128),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(32).max(512),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(32).max(512).optional(),
});
