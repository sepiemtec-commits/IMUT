import type { Role } from "./types.js";

/** Permissões RBAC do IMUT */
export const PERMISSIONS = {
  "billing:manage": ["OWNER"],
  "billing:read": ["OWNER", "ADMIN"],
  "responsibles:read": ["OWNER", "ADMIN", "VIEWER"],
  "responsibles:write": ["OWNER", "ADMIN"],
  "responsibles:delete": ["OWNER"],
  "devices:read": ["OWNER", "ADMIN", "VIEWER"],
  "devices:write": ["OWNER", "ADMIN"],
  "alerts:read": ["OWNER", "ADMIN", "VIEWER"],
  "alerts:acknowledge": ["OWNER", "ADMIN"],
  "reports:read": ["OWNER", "ADMIN", "VIEWER"],
  "dashboard:read": ["OWNER", "ADMIN", "VIEWER"],
  "audit:read": ["OWNER"],
  "push:write": ["OWNER", "ADMIN", "VIEWER"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: Role, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}
