"use client";

import { useState } from "react";
import Link from "next/link";
import { FiArrowUp, FiArrowDown } from "react-icons/fi";
import { formatCompact, formatPrice, topGainers, topLosers, trending } from "@/lib/market-data";
import { useCoins } from "@/hooks/use-coins";
import { Sparkline } from "@/components/ui/sparkline";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "trending", label: "Trending" },
  { key: "gainers", label: "Top Gainers" },
  { key: "losers", label: "Top Losers" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function MarketOverview() {
  const coins = useCoins(50);
  const [tab, setTab] = useState<TabKey>("trending");

  const rows =
    tab === "trending" ? trending(coins) : tab === "gainers" ? topGainers(coins) : topLosers(coins);

  return (
    <section id="markets" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">Live Markets</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time prices across our most actively traded pairs.{" "}
            <Link href="/markets" className="font-medium text-primary hover:underline">
              View all markets →
            </Link>
          </p>
        </div>
        <div className="flex gap-1 rounded-full border border-border bg-muted/60 p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                tab === t.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Asset</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">24h Change</th>
              <th className="px-4 py-3 font-medium">24h Volume</th>
              <th className="px-4 py-3 font-medium">Last 24h</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((coin) => {
              const positive = coin.change24h >= 0;
              return (
                <tr key={coin.id} className="border-b border-border last:border-0 hover:bg-accent">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
                        style={{ backgroundColor: coin.color }}
                      >
                        {coin.symbol.slice(0, 2)}
                      </span>
                      <div>
                        <div className="font-medium">{coin.symbol}</div>
                        <div className="text-xs text-muted-foreground">{coin.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">${formatPrice(coin.price)}</td>
                  <td className={cn("px-4 py-3 font-medium", positive ? "text-success" : "text-danger")}>
                    <span className="flex items-center gap-0.5">
                      {positive ? <FiArrowUp className="h-3 w-3" /> : <FiArrowDown className="h-3 w-3" />}
                      {Math.abs(coin.change24h).toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">${formatCompact(coin.volume24h)}</td>
                  <td className="px-4 py-3">
                    <Sparkline data={coin.sparkline} positive={positive} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/trade/${coin.symbol}-USDT`}>
                      <Button size="sm" variant="outline">
                        Trade
                      </Button>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
