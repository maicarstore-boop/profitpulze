"use client";

import { useCallback, useEffect, useState } from "react";
import { FiDollarSign, FiCheckCircle } from "react-icons/fi";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/status-badge";
import { StatCard } from "@/components/admin/stat-card";
import { formatPrice } from "@/lib/market-data";

const STATUSES = ["waiting", "confirming", "confirmed", "sending", "finished", "failed", "refunded", "expired"];

interface DepositRow {
  id: string;
  userEmail: string;
  paymentId: string;
  payCurrency: string;
  payAmount: number;
  priceAmountUsd: number;
  status: string;
  creditedAt: string | null;
  createdAt: string;
}

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<DepositRow[]>([]);
  const [totals, setTotals] = useState<Record<string, { total: number; count: number }>>({});
  const [status, setStatus] = useState("");
  const [user, setUser] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ limit: "150" });
    if (status) params.set("status", status);
    if (user) params.set("user", user);
    const res = await fetch(`/api/admin/payments/deposits?${params.toString()}`);
    const data = await res.json();
    if (Array.isArray(data.deposits)) setDeposits(data.deposits);
    if (data.totals) setTotals(data.totals);
  }, [status, user]);

  useEffect(() => {
    const refresh = async () => {
      const params = new URLSearchParams({ limit: "150" });
      if (status) params.set("status", status);
      if (user) params.set("user", user);
      const res = await fetch(`/api/admin/payments/deposits?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) return;
      if (Array.isArray(data.deposits)) setDeposits(data.deposits);
      if (data.totals) setTotals(data.totals);
    };

    void refresh();
    const id = setInterval(() => { void refresh(); }, 8000);
    return () => clearInterval(id);
  }, [status, user]);

  const finished = totals.finished ?? { total: 0, count: 0 };
  const inFlight = ["waiting", "confirming", "confirmed", "sending"].reduce(
    (sum, s) => sum + (totals[s]?.count ?? 0),
    0
  );

  const handleManualConfirm = async (depositId: string) => {
    setConfirmingId(depositId);
    try {
      const res = await fetch(`/api/admin/payments/deposits/${depositId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "confirm" }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Failed to confirm deposit.");
        return;
      }
      await load();
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Deposits</h1>
        <p className="mt-1 text-sm text-muted-foreground">Crypto deposits received via NOWPayments.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Total Credited"
          value={`$${formatPrice(finished.total)}`}
          icon={FiCheckCircle}
          sublabel={`${finished.count} finished deposits`}
        />
        <StatCard label="In Flight" value={String(inFlight)} icon={FiDollarSign} sublabel="waiting / confirming / sending" />
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
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Payment ID</th>
              <th className="px-4 py-3 font-medium">Pay Amount</th>
              <th className="px-4 py-3 font-medium">USD Value</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {deposits.map((d) => (
              <tr key={d.id} className="border-b border-border last:border-0 hover:bg-accent">
                <td className="px-4 py-3 text-muted-foreground">{d.userEmail}</td>
                <td className="px-4 py-3 font-mono text-xs">{d.paymentId}</td>
                <td className="px-4 py-3 font-mono text-xs">
                  {d.payAmount} {d.payCurrency.toUpperCase()}
                </td>
                <td className="px-4 py-3 font-mono text-xs">${formatPrice(d.priceAmountUsd)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={d.status} />
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(d.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={confirmingId === d.id || d.status === "finished"}
                    onClick={() => handleManualConfirm(d.id)}
                  >
                    {confirmingId === d.id ? "Confirming..." : "Confirm"}
                  </Button>
                </td>
              </tr>
            ))}
            {deposits.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No deposits match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
