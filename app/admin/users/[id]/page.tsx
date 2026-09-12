"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiLock,
  FiUnlock,
  FiUserX,
  FiUserCheck,
  FiShield,
  FiCheckCircle,
  FiXCircle,
  FiEdit2,
  FiTrash2,
} from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/admin/status-badge";
import { supportTickets } from "@/lib/admin-data";
import { ALL_ROLES, ROLE_LABELS } from "@/lib/auth/roles";
import { useAuth } from "@/components/auth/auth-provider";

interface AdminUserDetail {
  id: string;
  email: string;
  role: string;
  status: string;
  kycStatus: string;
  twoFactorEnabled: boolean;
  authProvider: string;
  createdAt: string;
  updatedAt: string;
}

interface AuditEntry {
  id: string;
  adminEmail: string;
  action: string;
  previousValue: unknown;
  newValue: unknown;
  reason?: string;
  ip: string;
  userAgent: string;
  createdAt: string;
}

interface LoginLogEntry {
  id: string;
  ip: string;
  userAgent: string;
  status: "success" | "failed";
  provider: string;
  createdAt: string;
}

interface WalletTransactionEntry {
  id: string;
  type: string;
  amount: number;
  note: string;
  createdAt: string;
}

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user: currentAdmin } = useAuth();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginLogEntry[]>([]);
  const [wallet, setWallet] = useState<{ available: number; locked: number; currency: string } | null>(null);
  const [holdings, setHoldings] = useState<{ symbol: string; quantity: number }[]>([]);
  const [transactions, setTransactions] = useState<WalletTransactionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/users/${id}`);
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
      setAuditLog(data.auditLog ?? []);
      setWallet(data.wallet ?? null);
      setHoldings(data.holdings ?? []);
      setTransactions(data.transactions ?? []);
      setSelectedRole(data.user.role);
      setEditEmail(data.user.email);

      const loginRes = await fetch(`/api/admin/login-logs?email=${encodeURIComponent(data.user.email)}&limit=8`);
      if (loginRes.ok) {
        const loginData = await loginRes.json();
        setLoginHistory(loginData.logs ?? []);
      }
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const runAction = async (action: string) => {
    setBusy(action);
    setError(null);
    const res = await fetch(`/api/admin/users/${id}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason: reason || undefined }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Action failed.");
    } else {
      setReason("");
      await load();
    }
    setBusy(null);
  };

  const assignRole = async () => {
    setBusy("role");
    setError(null);
    const res = await fetch(`/api/admin/users/${id}/role`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: selectedRole, reason: reason || undefined }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Role assignment failed.");
    } else {
      setReason("");
      await load();
    }
    setBusy(null);
  };

  const saveEmail = async () => {
    setBusy("edit");
    setError(null);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: editEmail, reason: reason || undefined }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Update failed.");
    } else {
      setReason("");
      await load();
    }
    setBusy(null);
  };

  const deleteUser = async () => {
    setBusy("delete");
    setError(null);
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Delete failed.");
      setBusy(null);
      return;
    }
    router.push("/admin/users");
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading user...</div>;
  }

  if (!user) {
    return <div className="text-sm text-muted-foreground">User not found.</div>;
  }

  const isSuperAdmin = currentAdmin?.role === "super_admin";

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/users" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <FiArrowLeft className="h-4 w-4" /> Back to all users
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{user.email}</h1>
          <StatusBadge status={user.status} />
          <StatusBadge status={user.kycStatus} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ?? user.role} · Joined{" "}
          {new Date(user.createdAt).toLocaleDateString()} · {user.authProvider === "google" ? "Google OAuth" : "Email & Password"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {error && (
            <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">{error}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {user.status !== "active" ? (
              <Button size="sm" variant="success" disabled={!!busy} onClick={() => runAction(user.status === "frozen" ? "unfreeze" : "reactivate")}>
                <FiUnlock className="h-3.5 w-3.5" /> {user.status === "frozen" ? "Unfreeze" : "Reactivate"} Account
              </Button>
            ) : (
              <>
                <Button size="sm" variant="outline" disabled={!!busy} onClick={() => runAction("freeze")}>
                  <FiLock className="h-3.5 w-3.5" /> Freeze Account
                </Button>
                <Button size="sm" variant="danger" disabled={!!busy} onClick={() => runAction("suspend")}>
                  <FiUserX className="h-3.5 w-3.5" /> Suspend Account
                </Button>
              </>
            )}
            <Button size="sm" variant="outline" disabled={!!busy} onClick={() => runAction("reset_2fa")}>
              <FiShield className="h-3.5 w-3.5" /> Reset 2FA
            </Button>
            {user.kycStatus === "pending" && (
              <>
                <Button size="sm" variant="success" disabled={!!busy} onClick={() => runAction("kyc_approve")}>
                  <FiCheckCircle className="h-3.5 w-3.5" /> Approve KYC
                </Button>
                <Button size="sm" variant="danger" disabled={!!busy} onClick={() => runAction("kyc_reject")}>
                  <FiXCircle className="h-3.5 w-3.5" /> Reject KYC
                </Button>
              </>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Reason (optional, applies to the next action)</label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Reported by compliance for unusual withdrawal pattern" className="mt-1" />
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-end">
            <div className="w-full sm:w-64">
              <label className="text-xs text-muted-foreground">Assign role</label>
              <Select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="mt-1" disabled={!isSuperAdmin}>
                {ALL_ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </Select>
            </div>
            <Button size="sm" disabled={!isSuperAdmin || busy === "role" || selectedRole === user.role} onClick={assignRole}>
              <FiUserCheck className="h-3.5 w-3.5" /> Update Role
            </Button>
            {!isSuperAdmin && <p className="text-xs text-muted-foreground">Only Super Admins can change roles.</p>}
          </div>

          {isSuperAdmin && (
            <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-end">
              <div className="w-full sm:w-80">
                <label className="text-xs text-muted-foreground">Email address</label>
                <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="mt-1" />
              </div>
              <Button size="sm" disabled={busy === "edit" || editEmail.trim().toLowerCase() === user.email} onClick={saveEmail}>
                <FiEdit2 className="h-3.5 w-3.5" /> Save Email
              </Button>
            </div>
          )}

          {isSuperAdmin && (
            <div className="space-y-3 rounded-lg border border-danger/30 bg-danger/5 p-4">
              <div>
                <p className="text-sm font-medium text-danger">Danger Zone</p>
                <p className="text-xs text-muted-foreground">
                  Permanently delete this account. This cannot be undone and only Super Admins can do this.
                </p>
              </div>
              {!showDeleteConfirm ? (
                <Button size="sm" variant="danger" onClick={() => setShowDeleteConfirm(true)}>
                  <FiTrash2 className="h-3.5 w-3.5" /> Delete User
                </Button>
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground">
                      Type <span className="font-mono">{user.email}</span> to confirm
                    </label>
                    <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} className="mt-1" />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={busy === "delete" || deleteConfirm !== user.email}
                      onClick={deleteUser}
                    >
                      <FiTrash2 className="h-3.5 w-3.5" /> Confirm Delete
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy === "delete"}
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirm("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs
        items={[
          {
            key: "wallets",
            label: "Wallets & Trading",
            content: (
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle>Wallet Balances</CardTitle></CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">USDT (cash)</span>
                      <span className="text-muted-foreground">
                        {wallet ? wallet.available.toFixed(2) : "—"}
                        {wallet && wallet.locked > 0 ? ` (+${wallet.locked.toFixed(2)} locked)` : ""}
                      </span>
                    </div>
                    {holdings.map((h) => (
                      <div key={h.symbol} className="flex items-center justify-between text-sm">
                        <span className="font-medium">{h.symbol}</span>
                        <span className="text-muted-foreground">{h.quantity}</span>
                      </div>
                    ))}
                    {holdings.length === 0 && (
                      <p className="text-xs text-muted-foreground">No crypto asset holdings.</p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Recent Wallet Activity</CardTitle></CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    {transactions.map((t) => (
                      <div key={t.id} className="flex items-center justify-between text-sm">
                        <span className="truncate">{t.note || t.type}</span>
                        <span className={t.amount >= 0 ? "text-success" : "text-danger"}>
                          {t.amount >= 0 ? "+" : ""}${t.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {transactions.length === 0 && (
                      <p className="text-xs text-muted-foreground">No wallet activity recorded for this user yet.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            ),
          },
          {
            key: "activity",
            label: "Login & Device History",
            content: (
              <Card className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="px-4 py-3 font-medium">IP Address</th>
                      <th className="px-4 py-3 font-medium">Provider</th>
                      <th className="px-4 py-3 font-medium">Device / User Agent</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loginHistory.map((log) => (
                      <tr key={log.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 font-mono text-xs">{log.ip}</td>
                        <td className="px-4 py-3 text-muted-foreground capitalize">{log.provider}</td>
                        <td className="px-4 py-3 max-w-[240px] truncate text-muted-foreground" title={log.userAgent}>{log.userAgent}</td>
                        <td className="px-4 py-3"><StatusBadge status={log.status === "success" ? "active" : "Rejected"} /></td>
                        <td className="px-4 py-3 text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                    {loginHistory.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No login attempts recorded for this user yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </Card>
            ),
          },
          {
            key: "support",
            label: "Referrals & Support",
            content: (
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle>Referral Information</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4 pt-0 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">Referred By</div>
                      <div className="font-medium">—</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Referrals Made</div>
                      <div className="font-medium">3</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Support Tickets</CardTitle></CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    {supportTickets.slice(0, 3).map((t) => (
                      <div key={t.id} className="flex items-center justify-between text-sm">
                        <span className="truncate">{t.subject}</span>
                        <StatusBadge status={t.status} />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            ),
          },
          {
            key: "audit",
            label: `Audit Log (${auditLog.length})`,
            content: (
              <Card className="overflow-x-auto">
                {auditLog.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-muted-foreground">No administrative actions recorded for this user yet.</p>
                ) : (
                  <table className="w-full min-w-[720px] text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs text-muted-foreground">
                        <th className="px-4 py-3 font-medium">Administrator</th>
                        <th className="px-4 py-3 font-medium">Action</th>
                        <th className="px-4 py-3 font-medium">Previous → New</th>
                        <th className="px-4 py-3 font-medium">Reason</th>
                        <th className="px-4 py-3 font-medium">IP</th>
                        <th className="px-4 py-3 font-medium">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLog.map((entry) => (
                        <tr key={entry.id} className="border-b border-border last:border-0">
                          <td className="px-4 py-3">{entry.adminEmail}</td>
                          <td className="px-4 py-3 font-mono text-xs">{entry.action}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {JSON.stringify(entry.previousValue)} → {JSON.stringify(entry.newValue)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{entry.reason ?? "—"}</td>
                          <td className="px-4 py-3 font-mono text-xs">{entry.ip}</td>
                          <td className="px-4 py-3 text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
