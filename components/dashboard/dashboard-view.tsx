"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiArrowUp, FiArrowDown, FiPlus, FiSend, FiX } from "react-icons/fi";
import { useCoins } from "@/hooks/use-coins";
import { coins as FALLBACK_COINS, formatCompact, formatPrice } from "@/lib/market-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DepositPanel } from "@/components/wallet/deposit-panel";
import { cn } from "@/lib/utils";

interface RecentTransaction {
  id: string;
  type: string;
  amount: number;
  note: string;
  createdAt: string;
}

const TRANSACTION_TYPE_LABEL: Record<string, string> = {
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  trade_stake: "Binary Trade Opened",
  trade_payout: "Binary Trade Payout",
  trade_refund: "Binary Trade Refund",
  stake_lock: "Staked",
  stake_unlock: "Unstaked",
  stake_reward: "Staking Reward",
  spot_buy: "Spot Buy",
  spot_sell: "Spot Sell",
  convert: "Convert",
};

export function DashboardView() {
  const router = useRouter();
  const liveCoins = useCoins(100);
  const [depositOpen, setDepositOpen] = useState(false);
  const [cashBalance, setCashBalance] = useState(0);
  const [holdings, setHoldings] = useState<{ symbol: string; quantity: number }[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentTransaction[]>([]);

  const refreshWallet = useCallback(() => {
    fetch("/api/wallet")
      .then((res) => res.json())
      .then((data) => setCashBalance(data.total ?? 0))
      .catch(() => {});
    fetch("/api/wallet/transactions?limit=6")
      .then((res) => res.json())
      .then((data) => setRecentActivity(Array.isArray(data.transactions) ? data.transactions : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshWallet();
    fetch("/api/holdings")
      .then((res) => res.json())
      .then((data) => setHoldings(Array.isArray(data.holdings) ? data.holdings : []))
      .catch(() => {});
  }, [refreshWallet]);

  const rows = holdings
    .map((h) => {
      const coin = liveCoins.find((c) => c.symbol === h.symbol) ?? FALLBACK_COINS.find((c) => c.symbol === h.symbol);
      return coin ? { ...h, coin, value: h.quantity * coin.price } : null;
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  const holdingsValue = rows.reduce((sum, r) => sum + r.value, 0);
  const totalValue = holdingsValue + cashBalance;
  // Cash doesn't move intraday, so only the crypto holdings contribute to the day-over-day change.
  const dayChange = rows.reduce((sum, r) => sum + r.value * (r.coin.change24h / 100), 0);
  const dayChangePct = holdingsValue ? (dayChange / (holdingsValue - dayChange)) * 100 : 0;
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
              <Button size="sm" onClick={() => setDepositOpen((v) => !v)}>
                <FiPlus className="h-3.5 w-3.5" /> Deposit
              </Button>
              <Link href="/wallet?tab=withdraw">
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

      {depositOpen && (
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Deposit Crypto</h2>
            <Button size="sm" variant="ghost" onClick={() => setDepositOpen(false)}>
              <FiX className="h-3.5 w-3.5" /> Close
            </Button>
          </div>
          <DepositPanel onFinished={refreshWallet} />
        </div>
      )}

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
                <tr className="border-b border-border last:border-0 hover:bg-accent">
                  <td className="px-4 py-3 font-medium">USDT</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {cashBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3">$1.00</td>
                  <td className="px-4 py-3 text-muted-foreground">—</td>
                  <td className="px-4 py-3 font-medium">${formatCompact(cashBalance)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href="/wallet?tab=deposit">
                      <Button size="sm" variant="outline">Deposit</Button>
                    </Link>
                  </td>
                </tr>
                {rows.map((row) => {
                  const rowPositive = row.coin.change24h >= 0;
                  return (
                    <tr
                      key={row.symbol}
                      onClick={() => router.push(`/convert?from=${row.symbol}`)}
                      className="cursor-pointer border-b border-border last:border-0 hover:bg-accent"
                    >
                      <td className="px-4 py-3 font-medium">{row.symbol}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.quantity}</td>
                      <td className="px-4 py-3">${formatPrice(row.coin.price)}</td>
                      <td className={cn("px-4 py-3", rowPositive ? "text-success" : "text-danger")}>
                        {rowPositive ? "+" : ""}
                        {row.coin.change24h.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 font-medium">${formatCompact(row.value)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/trade/${row.symbol}-USDT`} onClick={(e) => e.stopPropagation()}>
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
                  <div className="text-sm font-medium">{item.note || TRANSACTION_TYPE_LABEL[item.type] || item.type}</div>
                  <div className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</div>
                </div>
                <span className={cn("text-sm font-mono", item.amount > 0 ? "text-success" : item.amount < 0 ? "text-danger" : "text-muted-foreground")}>
                  {item.amount > 0 ? "+" : ""}
                  {item.amount !== 0 ? `$${Math.abs(item.amount).toFixed(2)}` : "—"}
                </span>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">No activity yet.</div>
            )}
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
