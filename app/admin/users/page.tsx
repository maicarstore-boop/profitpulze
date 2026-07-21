"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FiSearch, FiUserPlus } from "react-icons/fi";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/status-badge";
import { ROLE_LABELS, ALL_ROLES } from "@/lib/auth/roles";

interface AdminUserRow {
  id: string;
  email: string;
  role: string;
  status: string;
  kycStatus: string;
  authProvider: string;
  createdAt: string;
}

function UsersTableInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [statusFilter, setStatusFilter] = useState("all");
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (q: string) => {
    setLoading(true);
    const res = await fetch(`/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    const data = await res.json();
    setUsers(data.users ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load(searchParams.get("q") ?? "");
  }, [load, searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(query ? `/admin/users?q=${encodeURIComponent(query)}` : "/admin/users");
  };

  const filtered = users.filter((u) => statusFilter === "all" || u.status === statusFilter);

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">All Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">{users.length.toLocaleString()} accounts</p>
        </div>
        <Button size="sm" disabled title="User invitations are not wired up yet">
          <FiUserPlus className="h-4 w-4" /> Invite Admin
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <form onSubmit={handleSearch} className="relative max-w-sm flex-1">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by email..." className="pl-9" />
        </form>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="frozen">Frozen</option>
          <option value="suspended">Suspended</option>
        </Select>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">KYC</th>
              <th className="px-4 py-3 font-medium">Auth</th>
              <th className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  Loading users...
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No users match your filters.
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-0 hover:bg-accent">
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${user.id}`} className="font-medium text-primary hover:underline">
                      {user.email}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ?? user.role}</td>
                  <td className="px-4 py-3"><StatusBadge status={user.status} /></td>
                  <td className="px-4 py-3"><StatusBadge status={user.kycStatus} /></td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{user.authProvider}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </Card>

      <p className="text-xs text-muted-foreground">
        Roles: {ALL_ROLES.map((r) => ROLE_LABELS[r]).join(", ")}
      </p>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading...</div>}>
      <UsersTableInner />
    </Suspense>
  );
}
