"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/admin/stat-card";
import { formatPrice, formatCompact } from "@/lib/market-data";
import { FiZap, FiTrendingUp, FiInfo } from "react-icons/fi";

interface VolatilityPair {
  symbol: string;
  name: string;
  price: number;
  high24h: number;
  low24h: number;
  spreadPct: number;
  volume24h: number;
}

function useVolatility() {
  const [pairs, setPairs] = useState<VolatilityPair[]>([]);
  const [avgSpreadPct, setAvgSpreadPct] = useState(0);

  useEffect(() => {
    const load = () =>
      fetch("/api/admin/market-volatility?limit=100")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data.pairs)) setPairs(data.pairs);
          setAvgSpreadPct(data.avgSpreadPct ?? 0);
        });
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  return { pairs, avgSpreadPct };
}

function ScannerTab() {
  const { pairs, avgSpreadPct } = useVolatility();
  const top = pairs.slice(0, 25);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        <FiInfo className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          This platform has one real price source (CoinGecko), so genuine cross-venue arbitrage (buy low on venue A,
          sell high on venue B) can&apos;t be detected without a second independent feed — we don&apos;t fabricate
          one. What&apos;s shown below is real: each pair&apos;s actual 24h high/low spread, a genuine volatility
          signal from live market data.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Pairs Tracked" value={pairs.length.toString()} icon={FiZap} />
        <StatCard label="Avg. 24h Spread" value={`${avgSpreadPct}%`} icon={FiTrendingUp} />
        <StatCard label="Highest Spread" value={top[0] ? `${top[0].spreadPct}%` : "—"} icon={FiZap} sublabel={top[0]?.symbol} />
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Pair</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">24h Low</th>
              <th className="px-4 py-3 font-medium">24h High</th>
              <th className="px-4 py-3 font-medium">Spread</th>
              <th className="px-4 py-3 font-medium">24h Volume</th>
            </tr>
          </thead>
          <tbody>
            {top.map((p) => (
              <tr key={p.symbol} className="border-b border-border last:border-0 hover:bg-accent">
                <td className="px-4 py-3 font-medium">{p.symbol}/USDT</td>
                <td className="px-4 py-3">${formatPrice(p.price)}</td>
                <td className="px-4 py-3 text-muted-foreground">${formatPrice(p.low24h)}</td>
                <td className="px-4 py-3 text-muted-foreground">${formatPrice(p.high24h)}</td>
                <td className="px-4 py-3">
                  <Badge variant={p.spreadPct > 5 ? "danger" : p.spreadPct > 2 ? "outline" : "success"}>{p.spreadPct}%</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">${formatCompact(p.volume24h)}</td>
              </tr>
            ))}
            {top.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading market data…</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function ReportsTab() {
  const { pairs } = useVolatility();
  const mostVolatile = pairs.slice(0, 5);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Most Volatile Pairs (24h)</CardTitle>
          <CardDescription>Ranked by real high/low spread from live market data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 pt-0 text-sm">
          {mostVolatile.map((p) => (
            <div key={p.symbol} className="flex items-center justify-between border-b border-border py-2 last:border-0">
              <span className="font-medium">{p.symbol}/USDT</span>
              <span className="text-muted-foreground">{p.spreadPct}% spread</span>
            </div>
          ))}
          {mostVolatile.length === 0 && <p className="text-muted-foreground">Loading…</p>}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminArbitragePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Arbitrage Monitoring</h1>
        <p className="mt-1 text-sm text-muted-foreground">Real 24h price-spread and volatility monitoring from live market data.</p>
      </div>
      <Tabs
        items={[
          { key: "scanner", label: "Volatility Scanner", content: <ScannerTab /> },
          { key: "reports", label: "Historical Reports", content: <ReportsTab /> },
        ]}
      />
    </div>
  );
}
