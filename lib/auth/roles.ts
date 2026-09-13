export const ADMIN_ROLES = [
  "super_admin",
  "operations_manager",
  "compliance_officer",
  "finance_manager",
  "support_agent",
  "moderator",
  "read_only_auditor",
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];
export type UserRole = "user" | AdminRole;

export const ALL_ROLES: UserRole[] = ["user", ...ADMIN_ROLES];

export const ROLE_LABELS: Record<UserRole, string> = {
  user: "User",
  super_admin: "Super Admin",
  operations_manager: "Operations Manager",
  compliance_officer: "Compliance Officer",
  finance_manager: "Finance Manager",
  support_agent: "Support Agent",
  moderator: "Moderator",
  read_only_auditor: "Read-Only Auditor",
};

export function isAdminRole(role: string | undefined | null): role is AdminRole {
  return !!role && (ADMIN_ROLES as readonly string[]).includes(role);
}

export const PERMISSION_GROUPS = [
  "Users",
  "Trading",
  "Wallets",
  "Payments",
  "Markets",
  "Staking",
  "Copy Trading",
  "Arbitrage",
  "Reports",
  "Support",
  "Security",
  "Roles",
  "Notifications",
  "CMS",
  "Settings",
] as const;

export type PermissionGroup = (typeof PERMISSION_GROUPS)[number];

/**
 * Default capability matrix per role. This drives the Role Management UI —
 * changes made there are in-memory only (no persisted, per-tenant permission
 * override system), which is called out explicitly in that page's UI.
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<AdminRole, PermissionGroup[]> = {
  super_admin: [...PERMISSION_GROUPS],
  operations_manager: ["Users", "Trading", "Wallets", "Payments", "Markets", "Staking", "Copy Trading", "Arbitrage", "Reports"],
  compliance_officer: ["Users", "Security", "Reports"],
  finance_manager: ["Wallets", "Payments", "Reports", "Staking"],
  support_agent: ["Users", "Trading", "Support"],
  moderator: ["Trading", "Support", "CMS", "Notifications"],
  read_only_auditor: ["Users", "Trading", "Wallets", "Markets", "Reports", "Security"],
};

/**
 * Super Admin always passes regardless of the matrix (it lists every group
 * anyway, but this keeps the super-admin bypass explicit and future-proof
 * against the matrix drifting). Every other admin role is restricted to its
 * assigned modules from DEFAULT_ROLE_PERMISSIONS.
 */
export function hasPermission(role: string | undefined | null, group: PermissionGroup): boolean {
  if (role === "super_admin") return true;
  if (!isAdminRole(role)) return false;
  return DEFAULT_ROLE_PERMISSIONS[role].includes(group);
}
