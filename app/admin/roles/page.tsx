"use client";

import { useEffect, useState } from "react";
import { FiCheck, FiInfo } from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatusBadge } from "@/components/admin/status-badge";
import { ADMIN_ROLES, ROLE_LABELS, PERMISSION_GROUPS, DEFAULT_ROLE_PERMISSIONS, type PermissionGroup } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

interface AdminUser {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

function CurrentAdministrators() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);

  useEffect(() => {
    fetch("/api/admin/users?adminOnly=true&limit=200")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.users)) setAdmins(data.users);
      });
  }, []);

  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Since</th>
          </tr>
        </thead>
        <tbody>
          {admins.map((a) => (
            <tr key={a.id} className="border-b border-border last:border-0 hover:bg-accent">
              <td className="px-4 py-3 font-medium">{a.email}</td>
              <td className="px-4 py-3">{ROLE_LABELS[a.role as keyof typeof ROLE_LABELS] ?? a.role}</td>
              <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
              <td className="px-4 py-3 text-muted-foreground">{new Date(a.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
          {admins.length === 0 && (
            <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No administrator accounts found.</td></tr>
          )}
        </tbody>
      </table>
    </Card>
  );
}

export default function AdminRolesPage() {
  const [matrix, setMatrix] = useState(() =>
    Object.fromEntries(ADMIN_ROLES.map((role) => [role, new Set(DEFAULT_ROLE_PERMISSIONS[role])])) as Record<
      (typeof ADMIN_ROLES)[number],
      Set<PermissionGroup>
    >
  );

  const toggle = (role: (typeof ADMIN_ROLES)[number], group: PermissionGroup) => {
    setMatrix((prev) => {
      const next = { ...prev, [role]: new Set(prev[role]) };
      next[role].has(group) ? next[role].delete(group) : next[role].add(group);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Role Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">Role-based access control for the admin console.</p>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        <FiInfo className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          The matrix below is enforced: each role is restricted server-side to exactly these modules across admin
          pages, the sidebar, and the API. Super Admin always has every module regardless of the matrix. Toggling a
          checkbox here updates this view only — persisting a custom, per-tenant override requires a dedicated
          permissions collection, which isn&apos;t wired up in this build; the defaults shown are what&apos;s
          actually enforced. Role <em>assignment</em> per user (Super Admin only) is fully functional from each
          user&apos;s profile page.
        </p>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold">Current Administrators</h2>
        <CurrentAdministrators />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ADMIN_ROLES.map((role) => (
          <Card key={role}>
            <CardHeader>
              <CardTitle>{ROLE_LABELS[role]}</CardTitle>
              <CardDescription>{matrix[role].size} of {PERMISSION_GROUPS.length} modules enabled</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="sticky left-0 bg-card px-4 py-3 font-medium">Module</th>
              {ADMIN_ROLES.map((role) => (
                <th key={role} className="px-3 py-3 text-center font-medium">{ROLE_LABELS[role]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_GROUPS.map((group) => (
              <tr key={group} className="border-b border-border last:border-0">
                <td className="sticky left-0 bg-card px-4 py-2.5 font-medium">{group}</td>
                {ADMIN_ROLES.map((role) => {
                  const enabled = matrix[role].has(group);
                  return (
                    <td key={role} className="px-3 py-2.5 text-center">
                      <button
                        onClick={() => toggle(role, group)}
                        className={cn(
                          "mx-auto flex h-6 w-6 items-center justify-center rounded-md border transition-colors",
                          enabled ? "border-primary bg-primary text-primary-foreground" : "border-border text-transparent hover:border-muted-foreground"
                        )}
                        aria-label={`Toggle ${group} for ${ROLE_LABELS[role]}`}
                      >
                        <FiCheck className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
