import bcrypt from "bcrypt";
import { createHash, randomBytes } from "node:crypto";
import { LIMITS } from "@imut/shared";
import { registerSchema, loginSchema } from "@imut/shared";
import { prisma } from "../lib/prisma.js";
import { buildTokenPair, type TokenPair } from "../lib/jwt.js";
import { resolveAuthContext, type AuthContext } from "../lib/auth-context.js";
import { recordAudit } from "./audit.service.js";

const BCRYPT_ROUNDS = 12;

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base}-${randomBytes(3).toString("hex")}`;
}

function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function registerUser(input: unknown) {
  const data = registerSchema.parse(input);

  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing) {
    throw Object.assign(new Error("E-mail já cadastrado"), { code: "EMAIL_EXISTS" });
  }

  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
  const slug = slugify(data.organizationName);

  const result = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        name: data.organizationName,
        slug,
      },
    });

    const user = await tx.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        companyId: company.id,
      },
    });

    await tx.subscription.create({
      data: {
        companyId: company.id,
        status: "INCOMPLETE",
      },
    });

    return { user, company };
  });

  const tokens = buildTokenPair(result.user.id, result.company.id, "OWNER");
  await storeRefreshToken(result.user.id, tokens.refreshToken);

  await recordAudit({
    action: "AUTH_REGISTER",
    userId: result.user.id,
    companyId: result.company.id,
    success: true,
    metadata: { email: result.user.email },
  });

  const subscription = await prisma.subscription.findUnique({
    where: { companyId: result.company.id },
  });

  return {
    user: {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: "OWNER" as const,
    },
    company: { id: result.company.id, name: result.company.name },
    subscription: { status: subscription?.status ?? "INCOMPLETE" },
    ...tokens,
  };
}

export async function loginUser(input: unknown) {
  const data = loginSchema.parse(input);

  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user?.isActive) {
    throw Object.assign(new Error("Credenciais inválidas"), { code: "INVALID_CREDENTIALS" });
  }

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) {
    throw Object.assign(new Error("Credenciais inválidas"), { code: "INVALID_CREDENTIALS" });
  }

  const ctx = await resolveAuthContext(user.id);
  if (!ctx) {
    throw Object.assign(new Error("Usuário sem empresa vinculada"), { code: "NO_COMPANY" });
  }

  const tokens = buildTokenPair(ctx.userId, ctx.companyId, ctx.role);
  await storeRefreshToken(ctx.userId, tokens.refreshToken);

  await recordAudit({
    action: "AUTH_LOGIN",
    userId: ctx.userId,
    companyId: ctx.companyId,
    success: true,
    metadata: { email: ctx.email, role: ctx.role },
  });

  const subscription = await prisma.subscription.findUnique({
    where: { companyId: ctx.companyId },
  });

  return {
    user: {
      id: ctx.userId,
      email: ctx.email,
      name: user.name,
      role: ctx.role,
    },
    company: { id: ctx.companyId },
    subscription: subscription
      ? {
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd,
        }
      : null,
    ...tokens,
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenPair> {
  const { verifyRefreshToken } = await import("../lib/jwt.js");
  const payload = verifyRefreshToken(refreshToken);
  const tokenHash = hashRefreshToken(refreshToken);

  const stored = await prisma.refreshToken.findFirst({
    where: { userId: payload.sub, tokenHash, expiresAt: { gt: new Date() } },
  });

  if (!stored) {
    await recordAudit({
      action: "AUTH_REFRESH_FAILED",
      userId: payload.sub,
      success: false,
    });
    throw Object.assign(new Error("Refresh inválido"), { code: "INVALID_REFRESH" });
  }

  const ctx = await resolveAuthContext(payload.sub);
  if (!ctx) {
    throw Object.assign(new Error("Usuário inválido"), { code: "NO_COMPANY" });
  }

  await prisma.refreshToken.delete({ where: { id: stored.id } });

  const tokens = buildTokenPair(ctx.userId, ctx.companyId, ctx.role);
  await storeRefreshToken(ctx.userId, tokens.refreshToken);

  await recordAudit({
    action: "AUTH_REFRESH",
    userId: ctx.userId,
    companyId: ctx.companyId,
    success: true,
  });

  return tokens;
}

export async function logoutUser(userId: string, refreshToken?: string) {
  if (refreshToken) {
    const tokenHash = hashRefreshToken(refreshToken);
    await prisma.refreshToken.deleteMany({ where: { userId, tokenHash } });
  } else {
    await prisma.refreshToken.deleteMany({ where: { userId } });
  }

  await recordAudit({
    action: "AUTH_LOGOUT",
    userId,
    success: true,
  });
}

export async function recordFailedLogin(email: string, ip?: string) {
  await recordAudit({
    action: "AUTH_LOGIN_FAILED",
    success: false,
    ip,
    metadata: { email },
  });
}

export async function getMe(userId: string) {
  const ctx = await resolveAuthContext(userId);
  if (!ctx) return null;

  const [user, company, subscription] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, phone: true },
    }),
    prisma.company.findUnique({
      where: { id: ctx.companyId },
      select: { id: true, name: true, slug: true },
    }),
    prisma.subscription.findUnique({ where: { companyId: ctx.companyId } }),
  ]);

  const responsibleCount = await prisma.responsible.count({
    where: { companyId: ctx.companyId, isActive: true },
  });

  return {
    user,
    company,
    role: ctx.role,
    subscription,
    limits: {
      maxResponsibles: LIMITS.MAX_RESPONSIBLES_PER_ORG,
      responsiblesUsed: responsibleCount,
    },
  };
}

async function storeRefreshToken(userId: string, refreshToken: string) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt,
    },
  });
}

export type { AuthContext };
