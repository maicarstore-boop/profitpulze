"use client";

import { useCallback, useEffect, useState } from "react";
import { FiClock, FiCheckCircle } from "react-icons/fi";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/status-badge";
import { StatCard } from "@/components/admin/stat-card";
import { formatPrice } from "@/lib/market-data";

const STATUSES = ["pending", "approved", "rejected", "processing", "completed", "failed"];

interface WithdrawalRow {
  id: string;
  userEmail: string;
  currency: string;
  network: string;
  address: string;
  amountUsd: number;
  status: string;
  autoApproved: boolean;
  failureReason: string | null;
  createdAt: string;
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
  const [totals, setTotals] = useState<Record<string, { total: number; count: number }>>({});
  const [status, setStatus] = useState("");
  const [user, setUser] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ limit: "150" });
    if (status) params.set("status", status);
    if (user) params.set("user", user);
    const res = await fetch(`/api/admin/payments/withdrawals?${params.toString()}`);
    const data = await res.json();
    if (Array.isArray(data.withdrawals)) setWithdrawals(data.withdrawals);
    if (data.totals) setTotals(data.totals);
  }, [status, user]);

  useEffect(() => {
    load();
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
  }, [load]);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    const reason = action === "reject" ? window.prompt("Reason for rejection (optional):") ?? "" : undefined;
    setBusyId(id);
    try {
      await fetch(`/api/admin/payments/withdrawals/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const pending = totals.pending ?? { total: 0, count: 0 };
  const completed = totals.completed ?? { total: 0, count: 0 };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Withdrawals</h1>
        <p className="mt-1 text-sm text-muted-foreground">Withdrawal requests — approve or reject manual-review items.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Pending Review"
          value={`$${formatPrice(pending.total)}`}
          icon={FiClock}
          sublabel={`${pending.count} awaiting approval`}
        />
        <StatCard
          label="Total Completed"
          value={`$${formatPrice(completed.total)}`}
          icon={FiCheckCircle}
          sublabel={`${completed.count} paid out`}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Input placeholder="Search by user email" value={user} onChange={(e) => setUser(e.target.value)} className="w-56" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-52">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Address</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {withdrawals.map((w) => (
              <tr key={w.id} className="border-b border-border last:border-0 hover:bg-accent">
                <td className="px-4 py-3 text-muted-foreground">{w.userEmail}</td>
                <td className="px-4 py-3 font-mono text-xs">
                  {w.address.slice(0, 10)}…{w.address.slice(-6)}
                  <div className="text-muted-foreground">
                    {w.currency.toUpperCase()} ({w.network})
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs">${formatPrice(w.amountUsd)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={w.status} />
                  {w.autoApproved && <span className="ml-1.5 text-[10px] text-muted-foreground">(auto)</span>}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(w.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  {w.status === "pending" && (
                    <div className="flex justify-end gap-2">
                      <Button size="sm" disabled={busyId === w.id} onClick={() => handleAction(w.id, "approve")}>
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === w.id}
                        onClick={() => handleAction(w.id, "reject")}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {withdrawals.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No withdrawals match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
