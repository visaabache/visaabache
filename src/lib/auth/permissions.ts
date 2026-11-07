import type { Role } from "@prisma/client";

export const PERMISSIONS = [
  "applications.view",
  "applications.manage",
  "customers.view",
  "customers.manage",
  "inquiries.manage",
  "support.manage",
  "finance.view",
  "finance.manage",
  "content.manage",
  "marketing.manage",
  "settings.manage",
  "compliance.manage",
  "automation.run",
  "audit.view",
  "users.manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const STAFF: Permission[] = [
  "applications.view",
  "applications.manage",
  "customers.view",
  "inquiries.manage",
  "support.manage",
];

const ADMIN: Permission[] = PERMISSIONS.filter((p) => p !== "users.manage");

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  CUSTOMER: [],
  STAFF,
  ADMIN,
  OWNER: PERMISSIONS,
};

export function can(role: Role | undefined | null, permission: Permission) {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function isStaffRole(role: Role | undefined | null) {
  return role === "STAFF" || role === "ADMIN" || role === "OWNER";
}
