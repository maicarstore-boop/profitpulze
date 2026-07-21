"use client";

import { useCallback, useEffect, useState } from "react";
import { FiCreditCard, FiUsers, FiArrowUpCircle, FiArrowDownCircle } from "react-icons/fi";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { StatCard } from "@/components/admin/stat-card";
import { formatPrice } from "@/lib/market-data";
import { cn } from "@/lib/utils";

interface WalletTransaction {
  id: string;
  userEmail: string;
  type: string;
  amount: number;
  balanceAfter: number;
  note: string;
  createdAt: string;
}

interface UserBalanceRow {
  userId: string;
  userEmail: string;
  userStatus: string;
  tradingSuspended: boolean;
  available: number;
  currency: string;
  updatedAt: string;
}

const TYPE_LABEL: Record<string, string> = {
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  trade_stake: "Trade Stake",
  trade_payout: "Trade Payout",
  trade_refund: "Trade Refund",
};

function TransactionsTab() {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [totals, setTotals] = useState<Record<string, { total: number; count: number }>>({});
  const [type, setType] = useState("");
  const [user, setUser] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams({ limit: "150" });
    if (type) params.set("type", type);
    if (user) params.set("user", user);
    const res = await fetch(`/api/admin/wallet-transactions?${params.toString()}`);
    const data = await res.json();
    if (Array.isArray(data.transactions)) setTransactions(data.transactions);
    if (data.totals) setTotals(data.totals);
  }, [type, user]);

  useEffect(() => {
    load();
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
  }, [load]);

  const payouts = totals.trade_payout?.total ?? 0;
  const refunds = totals.trade_refund?.total ?? 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Total Payouts Issued"
          value={`$${formatPrice(payouts)}`}
          icon={FiArrowUpCircle}
          sublabel={`${totals.trade_payout?.count ?? 0} winning/draw trades`}
        />
        <StatCard
          label="Total Refunds Issued"
          value={`$${formatPrice(refunds)}`}
          icon={FiArrowDownCircle}
          sublabel={`${totals.trade_refund?.count ?? 0} admin-cancelled trades`}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Input placeholder="Search by user email" value={user} onChange={(e) => setUser(e.target.value)} className="w-56" />
        <Select value={type} onChange={(e) => setType(e.target.value)} className="w-52">
          <option value="">All types</option>
          {Object.entries(TYPE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Balance After</th>
              <th className="px-4 py-3 font-medium">Note</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-accent">
                <td className="px-4 py-3 text-muted-foreground">{tx.userEmail}</td>
                <td className="px-4 py-3">
                  <Badge variant={tx.amount >= 0 ? "success" : "danger"}>{TYPE_LABEL[tx.type] ?? tx.type}</Badge>
                </td>
                <td className={cn("px-4 py-3 font-mono text-xs", tx.amount >= 0 ? "text-success" : "text-danger")}>
                  {tx.amount >= 0 ? "+" : ""}${formatPrice(tx.amount)}
                </td>
                <td className="px-4 py-3 font-mono text-xs">${formatPrice(tx.balanceAfter)}</td>
                <td className="px-4 py-3 text-muted-foreground">{tx.note}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No transactions match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function UserBalancesTab() {
  const [balances, setBalances] = useState<UserBalanceRow[]>([]);
  const [summary, setSummary] = useState({ totalBalance: 0, walletCount: 0 });
  const [user, setUser] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams({ limit: "200" });
    if (user) params.set("user", user);
    const res = await fetch(`/api/admin/user-balances?${params.toString()}`);
    const data = await res.json();
    if (Array.isArray(data.balances)) setBalances(data.balances);
    if (data.summary) setSummary(data.summary);
  }, [user]);

  useEffect(() => {
    load();
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Total Platform Balance"
          value={`$${formatPrice(summary.totalBalance)}`}
          icon={FiCreditCard}
          sublabel="sum of all user wallets"
        />
        <StatCard label="Active Wallets" value={String(summary.walletCount)} icon={FiUsers} sublabel="users with a balance" />
      </div>

      <Input placeholder="Search by user email" value={user} onChange={(e) => setUser(e.target.value)} className="w-56" />

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Account Status</th>
              <th className="px-4 py-3 font-medium">Available Balance</th>
              <th className="px-4 py-3 font-medium">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {balances.map((b) => (
              <tr key={b.userId} className="border-b border-border last:border-0 hover:bg-accent">
                <td className="px-4 py-3 font-medium">{b.userEmail}</td>
                <td className="px-4 py-3">
                  <Badge variant={b.userStatus === "active" ? "success" : "outline"} className="capitalize">
                    {b.userStatus}
                  </Badge>
                  {b.tradingSuspended && <Badge variant="danger" className="ml-1.5">Trading Suspended</Badge>}
                </td>
                <td className="px-4 py-3 font-mono text-xs">
                  {formatPrice(b.available)} {b.currency}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(b.updatedAt).toLocaleString()}</td>
              </tr>
            ))}
            {balances.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No wallets match this search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export default function AdminWalletsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Wallet Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live user balances and transaction history for the binary trading wallet.
        </p>
      </div>

      <Tabs
        items={[
          { key: "transactions", label: "Transactions", content: <TransactionsTab /> },
          { key: "balances", label: "User Balances", content: <UserBalancesTab /> },
        ]}
      />
    </div>
  );
}
