"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/admin/stat-card";
import { formatPrice } from "@/lib/market-data";
import { FiUsers, FiTrendingUp, FiInfo } from "react-icons/fi";

interface Trader {
  userId: string;
  email: string;
  totalTrades: number;
  winRate: number;
  netProfitLoss: number;
  roi: number;
  aum: number;
  maxDrawdownPct: number;
}

function TradersTab() {
  const [traders, setTraders] = useState<Trader[]>([]);

  useEffect(() => {
    fetch("/api/admin/trader-leaderboard")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.traders)) setTraders(data.traders);
      });
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        <FiInfo className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          This leaderboard is real, ranked by each user&apos;s actual settled binary-trade performance (net P/L, win rate,
          ROI, and max drawdown computed from their real trade history). What isn&apos;t built in this version: an
          opt-in &quot;lead trader&quot; profile and automatic trade-mirroring engine for followers — that&apos;s a
          separate feature this leaderboard doesn&apos;t yet power.
        </p>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Trader</th>
              <th className="px-4 py-3 font-medium">Trades</th>
              <th className="px-4 py-3 font-medium">Net P/L</th>
              <th className="px-4 py-3 font-medium">ROI</th>
              <th className="px-4 py-3 font-medium">Win Rate</th>
              <th className="px-4 py-3 font-medium">Balance (AUM)</th>
              <th className="px-4 py-3 font-medium">Max Drawdown</th>
            </tr>
          </thead>
          <tbody>
            {traders.map((t) => (
              <tr key={t.userId} className="border-b border-border last:border-0 hover:bg-accent">
                <td className="px-4 py-3 font-medium">{t.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{t.totalTrades}</td>
                <td className={`px-4 py-3 ${t.netProfitLoss >= 0 ? "text-success" : "text-danger"}`}>
                  {t.netProfitLoss >= 0 ? "+" : ""}${formatPrice(t.netProfitLoss)}
                </td>
                <td className={`px-4 py-3 ${t.roi >= 0 ? "text-success" : "text-danger"}`}>{t.roi >= 0 ? "+" : ""}{t.roi}%</td>
                <td className="px-4 py-3 text-muted-foreground">{t.winRate}%</td>
                <td className="px-4 py-3 text-muted-foreground">${formatPrice(t.aum)}</td>
                <td className="px-4 py-3 text-danger">-{t.maxDrawdownPct}%</td>
              </tr>
            ))}
            {traders.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No users with 3+ settled trades yet.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function PerformanceTab() {
  const [traders, setTraders] = useState<Trader[]>([]);

  useEffect(() => {
    fetch("/api/admin/trader-leaderboard")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.traders)) setTraders(data.traders);
      });
  }, []);

  const profitable = traders.filter((t) => t.netProfitLoss > 0).length;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Ranked Traders" value={traders.length.toString()} icon={FiUsers} sublabel="3+ settled trades" />
        <StatCard label="Currently Profitable" value={profitable.toString()} icon={FiTrendingUp} sublabel="net P/L > 0" />
        <StatCard label="Platform-wide Max Drawdown Cap" value="25%" icon={FiUsers} sublabel="not yet enforced" />
      </div>
      <Card>
        <CardHeader><CardTitle>Risk Settings</CardTitle></CardHeader>
        <CardContent className="space-y-2 pt-0 text-sm text-muted-foreground">
          <p>Real drawdown is computed per trader from their actual trade sequence above.</p>
          <p>Automatic follower risk controls (allocation caps, auto-stop thresholds) require the copy-execution engine noted above, which isn&apos;t built.</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminCopyTradingPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Copy Trading</h1>
        <p className="mt-1 text-sm text-muted-foreground">Real trader performance leaderboard, ranked by actual trading results.</p>
      </div>
      <Tabs
        items={[
          { key: "traders", label: "Traders & Followers", content: <TradersTab /> },
          { key: "performance", label: "Performance & Risk", content: <PerformanceTab /> },
        ]}
      />
    </div>
  );
}
