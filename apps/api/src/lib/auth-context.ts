import type { Role } from "@imut/shared";
import { UserRole } from "@prisma/client";
import { prisma } from "./prisma.js";

export interface AuthContext {
  userId: string;
  companyId: string;
  role: Role;
  email: string;
}

/** Resolve empresa e papel: OWNER (dono) ou Responsible convidado */
export async function resolveAuthContext(userId: string): Promise<AuthContext | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId, isActive: true },
    include: { responsible: true },
  });

  if (!user) return null;

  if (user.companyId) {
    return {
      userId: user.id,
      companyId: user.companyId,
      role: "OWNER",
      email: user.email,
    };
  }

  if (user.responsible?.isActive) {
    const role = user.responsible.role as Role;
    return {
      userId: user.id,
      companyId: user.responsible.companyId,
      role,
      email: user.email,
    };
  }

  return null;
}

export function prismaRoleToShared(role: UserRole): Role {
  return role as Role;
}
