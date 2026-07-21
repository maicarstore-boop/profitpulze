"use client";

import { useMemo } from "react";
import { TrendChart } from "@/components/admin/charts/trend-chart";
import { BarListChart } from "@/components/admin/charts/bar-list-chart";
import { DonutChart } from "@/components/admin/charts/donut-chart";
import {
  volumeTrend,
  revenueTrend,
  userGrowthTrend,
  activeSessionsTrend,
  deviceStats,
  browserStats,
  countryStats,
  walletActivityTrend,
} from "@/lib/admin-data";
import { formatCompact } from "@/lib/market-data";
import { useCoins } from "@/hooks/use-coins";

export default function AdminAnalyticsPage() {
  const coins = useCoins(50);
  const coinPopularity = useMemo(
    () =>
      [...coins]
        .sort((a, b) => b.volume24h - a.volume24h)
        .slice(0, 8)
        .map((c) => ({ label: c.symbol, value: c.volume24h })),
    [coins]
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Platform-wide trends across trading, users, and infrastructure.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TrendChart title="Trading Volume (7d)" data={volumeTrend} color="var(--primary)" valueFormatter={(v) => `$${formatCompact(v)}`} />
        <TrendChart title="Revenue (7d)" data={revenueTrend} color="var(--success)" valueFormatter={(v) => `$${(v / 1000).toFixed(1)}K`} />
        <TrendChart title="User Growth (6w)" data={userGrowthTrend} color="var(--primary)" valueFormatter={(v) => v.toLocaleString()} />
        <TrendChart title="Active Sessions (24h)" data={activeSessionsTrend} color="#38BDF8" valueFormatter={(v) => v.toLocaleString()} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <DonutChart title="Device Statistics" data={deviceStats.map((d) => ({ ...d, label: `${d.label} (${d.value}%)` }))} />
        <DonutChart title="Browser Statistics" data={browserStats.map((d) => ({ ...d, label: `${d.label} (${d.value}%)` }))} />
        <BarListChart title="Country Statistics" description="Registered users by country" data={countryStats} color="var(--primary)" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BarListChart title="Coin Popularity" description="24h volume by asset" data={coinPopularity} color="#F0B90B" />
        <TrendChart title="Wallet Activity (7d)" description="Deposits + withdrawals + transfers, count" data={walletActivityTrend} color="#0ECB81" />
      </div>
    </div>
  );
}
