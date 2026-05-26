import type { Request } from "express";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";

export interface AuditEntry {
  action: string;
  companyId?: string | null;
  userId?: string | null;
  resource?: string;
  resourceId?: string;
  method?: string;
  path?: string;
  ip?: string;
  userAgent?: string;
  statusCode?: number;
  success?: boolean;
  metadata?: Record<string, unknown>;
}

export function clientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0]!.trim();
  }
  return req.ip ?? req.socket.remoteAddress ?? "unknown";
}

export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: entry.action,
        companyId: entry.companyId ?? undefined,
        userId: entry.userId ?? undefined,
        resource: entry.resource,
        resourceId: entry.resourceId,
        method: entry.method,
        path: entry.path,
        ip: entry.ip,
        userAgent: entry.userAgent,
        statusCode: entry.statusCode,
        success: entry.success ?? true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadata: (entry.metadata ?? undefined) as any,
      },
    });
  } catch (err) {
    logger.error({ err, action: entry.action }, "Falha ao gravar audit log");
  }
}

export async function recordAuditFromRequest(
  req: Request,
  action: string,
  options: Omit<AuditEntry, "action" | "method" | "path" | "ip" | "userAgent"> & {
    statusCode?: number;
  } = {},
): Promise<void> {
  await recordAudit({
    action,
    companyId: req.user?.companyId ?? options.companyId,
    userId: req.user?.sub ?? options.userId,
    method: req.method,
    path: req.originalUrl,
    ip: clientIp(req),
    userAgent: req.headers["user-agent"]?.slice(0, 512),
    ...options,
  });
}
