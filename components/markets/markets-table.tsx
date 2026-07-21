"use client";

import { useState } from "react";
import Link from "next/link";
import { FiArrowUp, FiArrowDown, FiSearch } from "react-icons/fi";
import { useCoins } from "@/hooks/use-coins";
import { formatCompact, formatPrice } from "@/lib/market-data";
import { Sparkline } from "@/components/ui/sparkline";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MarketsTable() {
  const coins = useCoins(100);
  const [query, setQuery] = useState("");

  const filtered = coins.filter(
    (c) =>
      c.symbol.toLowerCase().includes(query.toLowerCase()) ||
      c.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <div className="relative max-w-sm">
        <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search assets..."
          className="pl-9"
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Asset</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">24h Change</th>
              <th className="px-4 py-3 font-medium">24h Volume</th>
              <th className="px-4 py-3 font-medium">Market Cap</th>
              <th className="px-4 py-3 font-medium">Last 24h</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((coin) => {
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
                  <td className="px-4 py-3 text-muted-foreground">${formatCompact(coin.marketCap)}</td>
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
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  No assets match &ldquo;{query}&rdquo;
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
