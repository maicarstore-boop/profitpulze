"use client";

import Link from "next/link";
import { FiArrowUp, FiArrowDown, FiPlus, FiSend } from "react-icons/fi";
import { useCoins } from "@/hooks/use-coins";
import { coins as FALLBACK_COINS, formatCompact, formatPrice } from "@/lib/market-data";
import { holdings, recentActivity } from "@/lib/portfolio-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DashboardView() {
  const liveCoins = useCoins(100);

  const rows = holdings.map((h) => {
    const coin = liveCoins.find((c) => c.symbol === h.symbol) ?? FALLBACK_COINS.find((c) => c.symbol === h.symbol)!;
    return { ...h, coin, value: h.quantity * coin.price };
  });

  const totalValue = rows.reduce((sum, r) => sum + r.value, 0);
  const dayChange = rows.reduce((sum, r) => sum + r.value * (r.coin.change24h / 100), 0);
  const dayChangePct = totalValue ? (dayChange / (totalValue - dayChange)) * 100 : 0;
  const positive = dayChange >= 0;

  const watchlist = liveCoins.slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="sm:col-span-2">
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Portfolio Value</div>
            <div className="mt-1 text-3xl font-bold">
              ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
            <div className={cn("mt-1 flex items-center gap-1 text-sm font-medium", positive ? "text-success" : "text-danger")}>
              {positive ? <FiArrowUp className="h-3.5 w-3.5" /> : <FiArrowDown className="h-3.5 w-3.5" />}
              ${Math.abs(dayChange).toLocaleString(undefined, { maximumFractionDigits: 2 })} ({Math.abs(dayChangePct).toFixed(2)}%) today
            </div>
            <div className="mt-4 flex gap-3">
              <Link href="/buy-crypto">
                <Button size="sm"><FiPlus className="h-3.5 w-3.5" /> Deposit</Button>
              </Link>
              <Link href="/wallet">
                <Button size="sm" variant="outline"><FiSend className="h-3.5 w-3.5" /> Withdraw</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Staking Rewards (30d)</div>
            <div className="mt-1 text-2xl font-bold text-success">+$186.40</div>
            <div className="mt-4 text-xs text-muted-foreground">Referral Earnings</div>
            <div className="text-lg font-semibold">$1,240.50</div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="text-lg font-semibold">Holdings</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Asset</th>
                  <th className="px-4 py-3 font-medium">Quantity</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">24h</th>
                  <th className="px-4 py-3 font-medium">Value</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const rowPositive = row.coin.change24h >= 0;
                  return (
                    <tr key={row.symbol} className="border-b border-border last:border-0 hover:bg-accent">
                      <td className="px-4 py-3 font-medium">{row.symbol}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.quantity}</td>
                      <td className="px-4 py-3">${formatPrice(row.coin.price)}</td>
                      <td className={cn("px-4 py-3", rowPositive ? "text-success" : "text-danger")}>
                        {rowPositive ? "+" : ""}
                        {row.coin.change24h.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 font-medium">${formatCompact(row.value)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/trade/${row.symbol}-USDT`}>
                          <Button size="sm" variant="outline">Trade</Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <h2 className="mt-8 text-lg font-semibold">Recent Activity</h2>
          <div className="mt-4 divide-y divide-border rounded-2xl border border-border">
            {recentActivity.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="text-sm font-medium">
                    {item.type} {item.asset}
                  </div>
                  <div className="text-xs text-muted-foreground">{item.time}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{item.amount}</span>
                  <Badge variant={item.status === "Completed" ? "success" : "outline"}>
                    {item.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Watchlist</h2>
          <div className="mt-4 space-y-2">
            {watchlist.map((coin) => {
              const wPositive = coin.change24h >= 0;
              return (
                <Link
                  key={coin.id}
                  href={`/trade/${coin.symbol}-USDT`}
                  className="flex items-center justify-between rounded-xl border border-border px-4 py-3 hover:bg-accent"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: coin.color }}
                    >
                      {coin.symbol.slice(0, 2)}
                    </span>
                    <span className="text-sm font-medium">{coin.symbol}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">${formatPrice(coin.price)}</div>
                    <div className={cn("text-xs", wPositive ? "text-success" : "text-danger")}>
                      {wPositive ? "+" : ""}
                      {coin.change24h.toFixed(2)}%
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
