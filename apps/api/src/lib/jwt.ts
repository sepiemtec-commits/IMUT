import jwt from "jsonwebtoken";
import type { JwtPayload, Role } from "@imut/shared";
import { env } from "../config/env.js";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string };
}

export function buildTokenPair(
  userId: string,
  companyId: string,
  role: Role,
): TokenPair {
  return {
    accessToken: signAccessToken({ sub: userId, companyId, role }),
    refreshToken: signRefreshToken(userId),
  };
}
