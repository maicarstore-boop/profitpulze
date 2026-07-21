"use client";

import { useEffect, useState } from "react";
import { FiDownload } from "react-icons/fi";
import { formatPrice } from "@/lib/market-data";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import type { BinaryTradeRow } from "@/components/binary/active-trades-panel";

interface StatsBucket {
  totalTrades: number;
  wins: number;
  losses: number;
  draws: number;
  netProfitLoss: number;
  totalStaked: number;
  winRate: number;
}

interface Stats {
  daily: StatsBucket;
  weekly: StatsBucket;
  monthly: StatsBucket;
  allTime: StatsBucket;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  note: string;
  createdAt: string;
}

const RESULT_VARIANT = { win: "success", lose: "danger", draw: "default" } as const;

function StatCard({ label, bucket }: { label: string; bucket: StatsBucket }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className={cn("mt-2 text-2xl font-bold", bucket.netProfitLoss >= 0 ? "text-success" : "text-danger")}>
          {bucket.netProfitLoss >= 0 ? "+" : ""}
          ${formatPrice(bucket.netProfitLoss)}
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{bucket.totalTrades} trades</span>
          <span>{bucket.winRate}% win rate</span>
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs">
          <span className="text-success">{bucket.wins}W</span>
          <span className="text-danger">{bucket.losses}L</span>
          <span className="text-muted-foreground">{bucket.draws}D</span>
        </div>
      </CardContent>
    </Card>
  );
}

function TradeHistoryTable() {
  const [trades, setTrades] = useState<BinaryTradeRow[]>([]);
  const [status, setStatus] = useState("");
  const [symbol, setSymbol] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({ limit: "200" });
    if (status) params.set("status", status);
    if (symbol) params.set("symbol", symbol);
    fetch(`/api/binary/trades?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data.trades)) setTrades(data.trades);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [status, symbol]);

  const exportUrl = (() => {
    const params = new URLSearchParams({ format: "csv" });
    if (status) params.set("status", status);
    if (symbol) params.set("symbol", symbol);
    return `/api/binary/trades?${params.toString()}`;
  })();

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 py-4">
        <Input
          placeholder="Filter by symbol (e.g. BTC)"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          className="max-w-[220px]"
        />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-[180px]">
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="settled">Settled</option>
          <option value="cancelled">Cancelled</option>
        </Select>
        <a href={exportUrl} download>
          <Button variant="outline" size="sm" className="gap-1.5">
            <FiDownload className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </a>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Symbol</th>
              <th className="px-4 py-3 font-medium">Direction</th>
              <th className="px-4 py-3 font-medium">Entry</th>
              <th className="px-4 py-3 font-medium">Exit</th>
              <th className="px-4 py-3 font-medium">Stake</th>
              <th className="px-4 py-3 font-medium">P/L</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Opened</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => (
              <tr key={t.id} className="border-b border-border last:border-0 hover:bg-accent">
                <td className="px-4 py-3 font-medium">{t.symbol}/USDT</td>
                <td className="px-4 py-3 capitalize">{t.direction}</td>
                <td className="px-4 py-3 font-mono text-xs">${formatPrice(t.entryPrice)}</td>
                <td className="px-4 py-3 font-mono text-xs">{t.exitPrice ? `$${formatPrice(t.exitPrice)}` : "—"}</td>
                <td className="px-4 py-3">${formatPrice(t.stake)}</td>
                <td
                  className={cn(
                    "px-4 py-3 font-mono text-xs",
                    (t.profitLoss ?? 0) > 0 ? "text-success" : (t.profitLoss ?? 0) < 0 ? "text-danger" : "text-muted-foreground"
                  )}
                >
                  {t.profitLoss !== null ? `${t.profitLoss >= 0 ? "+" : ""}$${formatPrice(t.profitLoss)}` : "—"}
                </td>
                <td className="px-4 py-3">
                  {t.status === "open" && <Badge variant="primary">Open</Badge>}
                  {t.status === "cancelled" && <Badge variant="outline">Cancelled</Badge>}
                  {t.status === "settled" && (
                    <Badge variant={RESULT_VARIANT[t.result ?? "draw"]} className="capitalize">
                      {t.result}
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(t.openedAt).toLocaleString()}
                </td>
              </tr>
            ))}
            {!loading && trades.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No trades match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TransactionHistoryTable() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    fetch("/api/binary/transactions?limit=200")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.transactions)) setTransactions(data.transactions);
      });
  }, []);

  return (
    <div className="mt-4 divide-y divide-border rounded-2xl border border-border">
      {transactions.map((t) => (
        <div key={t.id} className="flex items-center justify-between px-4 py-3">
          <div>
            <div className="text-sm font-medium capitalize">{t.type.replace(/_/g, " ")}</div>
            <div className="text-xs text-muted-foreground">{t.note || new Date(t.createdAt).toLocaleString()}</div>
          </div>
          <div className="text-right">
            <div className={cn("font-mono text-sm", t.amount >= 0 ? "text-success" : "text-danger")}>
              {t.amount >= 0 ? "+" : ""}
              ${formatPrice(t.amount)}
            </div>
            <div className="text-xs text-muted-foreground">Balance ${formatPrice(t.balanceAfter)}</div>
          </div>
        </div>
      ))}
      {transactions.length === 0 && (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">No transactions yet.</div>
      )}
    </div>
  );
}

export function BinaryHistoryView() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/binary/balance")
      .then((res) => res.json())
      .then((data) => {
        if (data.stats) setStats(data.stats);
      });
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Today" bucket={stats.daily} />
          <StatCard label="This Week" bucket={stats.weekly} />
          <StatCard label="This Month" bucket={stats.monthly} />
          <StatCard label="All Time" bucket={stats.allTime} />
        </div>
      )}

      <div className="mt-8">
        <Tabs
          items={[
            { key: "trades", label: "Trade History", content: <TradeHistoryTable /> },
            { key: "transactions", label: "Transaction History", content: <TransactionHistoryTable /> },
          ]}
        />
      </div>
    </div>
  );
}
