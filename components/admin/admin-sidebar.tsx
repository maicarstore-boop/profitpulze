"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiTrendingUp, FiX } from "react-icons/fi";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { hasPermission, type UserRole } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname.startsWith(href);
}

function NavContent({ pathname, collapsed, adminRole }: { pathname: string; collapsed: boolean; adminRole: UserRole }) {
  const visibleGroups = ADMIN_NAV.map((group) => ({
    ...group,
    children: group.children?.filter((child) => !child.permission || hasPermission(adminRole, child.permission)),
  })).filter((group) => (group.children ? group.children.length > 0 : !group.permission || hasPermission(adminRole, group.permission)));

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
      {visibleGroups.map((group) => {
        if (group.children) {
          return (
            <div key={group.label} className="mb-2">
              {!collapsed && (
                <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <group.icon className="h-4 w-4" />
                  {group.label}
                </div>
              )}
              {group.children.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  title={collapsed ? child.label : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-colors",
                    collapsed ? "justify-center px-2" : "px-3 pl-9",
                    isActive(pathname, child.href)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  {collapsed ? child.label.slice(0, 1) : child.label}
                </Link>
              ))}
            </div>
          );
        }

        const active = isActive(pathname, group.href!);
        return (
          <Link
            key={group.href}
            href={group.href!}
            title={collapsed ? group.label : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors",
              collapsed ? "justify-center px-2" : "px-3",
              active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <group.icon className="h-4.5 w-4.5 shrink-0" />
            {!collapsed && <span className="truncate">{group.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminSidebar({
  adminRole,
  collapsed,
  mobileOpen,
  onCloseMobile,
}: {
  adminRole: UserRole;
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden shrink-0 flex-col border-r border-border bg-card transition-[width] duration-200 md:flex",
          collapsed ? "w-[68px]" : "w-64"
        )}
      >
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FiTrendingUp className="h-4.5 w-4.5" />
          </span>
          {!collapsed && <span className="truncate font-bold">ProfitPulze</span>}
        </div>
        <NavContent pathname={pathname} collapsed={collapsed} adminRole={adminRole} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onCloseMobile} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-card">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <FiTrendingUp className="h-4.5 w-4.5" />
                </span>
                <span className="font-bold">ProfitPulze</span>
              </div>
              <button
                onClick={onCloseMobile}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent"
                aria-label="Close menu"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <NavContent pathname={pathname} collapsed={false} adminRole={adminRole} />
          </aside>
        </div>
      )}
    </>
  );
}
