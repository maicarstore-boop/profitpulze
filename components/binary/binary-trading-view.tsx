"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FiClock, FiClipboard } from "react-icons/fi";
import { useCoins } from "@/hooks/use-coins";
import { useAuth } from "@/components/auth/auth-provider";
import { CandlestickChart } from "@/components/trade/candlestick-chart";
import { BinaryStatsBar } from "@/components/binary/binary-stats-bar";
import { BinaryTradePanel } from "@/components/binary/binary-trade-panel";
import { ActiveTradesPanel, type BinaryTradeRow } from "@/components/binary/active-trades-panel";
import { RecentSettlements } from "@/components/binary/recent-settlements";
import { Button } from "@/components/ui/button";

const POLL_MS = 3000;

interface BalanceState {
  available: number;
  locked: number;
}

export function BinaryTradingView({ symbol }: { symbol: string }) {
  const { user } = useAuth();
  const liveCoins = useCoins(100);
  const coin = liveCoins.find((c) => c.symbol === symbol) ?? liveCoins[0];

  const [balance, setBalance] = useState<BalanceState | null>(null);
  const [openTrades, setOpenTrades] = useState<BinaryTradeRow[]>([]);
  const [settledTrades, setSettledTrades] = useState<BinaryTradeRow[]>([]);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const [balanceRes, openRes, settledRes] = await Promise.all([
        fetch("/api/binary/balance"),
        fetch("/api/binary/trades?status=open&limit=25"),
        fetch("/api/binary/trades?status=settled&limit=10"),
      ]);
      const [balanceData, openData, settledData] = await Promise.all([
        balanceRes.json(),
        openRes.json(),
        settledRes.json(),
      ]);
      if (balanceData.balance) setBalance(balanceData.balance);
      if (Array.isArray(openData.trades)) setOpenTrades(openData.trades);
      if (Array.isArray(settledData.trades)) setSettledTrades(settledData.trades);
    } catch {
      // Keep showing the last known state; the next poll will retry.
    }
  }, [user]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  if (!coin) return null;

  if (!user) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
        <FiClock className="h-10 w-10 text-muted-foreground" />
        <h1 className="text-xl font-semibold text-foreground">Sign in to trade</h1>
        <p className="text-sm text-muted-foreground">
          Binary options trading requires an account so we can track your positions and balance.
        </p>
        <div className="flex gap-3">
          <Link href="/login">
            <Button variant="primary">Log In</Button>
          </Link>
          <Link href="/register">
            <Button variant="outline">Sign Up</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <BinaryStatsBar coin={coin} />

      <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Balance <span className="font-mono font-medium text-foreground">${(balance?.available ?? 0).toFixed(2)}</span>
              </div>
              <Link
                href="/binary/history"
                className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <FiClipboard className="h-3.5 w-3.5" /> Trading History
              </Link>
            </div>
            <CandlestickChart symbol={coin.symbol} price={coin.price} positive={coin.change24h >= 0} />
            <ActiveTradesPanel trades={openTrades} />
            <RecentSettlements trades={settledTrades} />
          </div>

          <BinaryTradePanel
            symbol={coin.symbol}
            price={coin.price}
            available={balance?.available ?? 0}
            onPlaced={refresh}
          />
        </div>
      </div>
    </div>
  );
}
