import {
  FiGrid,
  FiUsers,
  FiTrendingUp,
  FiCreditCard,
  FiPieChart,
  FiLock,
  FiCopy,
  FiZap,
  FiFileText,
  FiHeadphones,
  FiShield,
  FiClipboard,
  FiKey,
  FiBell,
  FiLayout,
  FiSettings,
} from "react-icons/fi";
import type { IconType } from "react-icons";
import type { PermissionGroup } from "@/lib/auth/roles";

export interface AdminNavLink {
  label: string;
  href: string;
  /** Omit for links every admin role can always reach (e.g. Overview). */
  permission?: PermissionGroup;
}

export interface AdminNavGroup {
  label: string;
  icon: IconType;
  href?: string;
  permission?: PermissionGroup;
  children?: AdminNavLink[];
}

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    label: "Dashboard",
    icon: FiGrid,
    children: [
      { label: "Overview", href: "/admin" },
      { label: "Analytics", href: "/admin/analytics", permission: "Reports" },
    ],
  },
  { label: "User Management", icon: FiUsers, href: "/admin/users", permission: "Users" },
  { label: "Trading Management", icon: FiTrendingUp, href: "/admin/trading", permission: "Trading" },
  { label: "Wallet Management", icon: FiCreditCard, href: "/admin/wallets", permission: "Wallets" },
  { label: "Market Management", icon: FiPieChart, href: "/admin/markets", permission: "Markets" },
  { label: "Staking Management", icon: FiLock, href: "/admin/staking", permission: "Staking" },
  { label: "Copy Trading", icon: FiCopy, href: "/admin/copy-trading", permission: "Copy Trading" },
  { label: "Arbitrage Monitoring", icon: FiZap, href: "/admin/arbitrage", permission: "Arbitrage" },
  { label: "Financial Reports", icon: FiFileText, href: "/admin/reports", permission: "Reports" },
  { label: "Customer Support", icon: FiHeadphones, href: "/admin/support", permission: "Support" },
  { label: "Security Center", icon: FiShield, href: "/admin/security", permission: "Security" },
  { label: "Audit Trail", icon: FiClipboard, href: "/admin/audit-log", permission: "Security" },
  { label: "Role Management", icon: FiKey, href: "/admin/roles", permission: "Roles" },
  { label: "Notification Center", icon: FiBell, href: "/admin/notifications", permission: "Notifications" },
  { label: "CMS", icon: FiLayout, href: "/admin/cms", permission: "CMS" },
  { label: "Settings", icon: FiSettings, href: "/admin/settings", permission: "Settings" },
];
