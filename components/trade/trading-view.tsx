"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FiClock, FiClipboard } from "react-icons/fi";
import { useCoins } from "@/hooks/use-coins";
import { useAuth } from "@/components/auth/auth-provider";
import { MarketStatsBar } from "@/components/trade/market-stats-bar";
import { CandlestickChart } from "@/components/trade/candlestick-chart";
import { OrderBook } from "@/components/trade/order-book";
import { RecentTrades } from "@/components/trade/recent-trades";
import { TradePanel, type PlacedOrder } from "@/components/trade/trade-panel";
import { OrdersPanel } from "@/components/trade/orders-panel";
import { Tabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

export function TradingView({ symbol }: { symbol: string }) {
  const { user } = useAuth();
  const liveCoins = useCoins(100);
  const coin = liveCoins.find((c) => c.symbol === symbol) ?? liveCoins[0];
  const [orders, setOrders] = useState<PlacedOrder[]>([]);
  const [balance, setBalance] = useState(0);
  const [holdings, setHoldings] = useState<{ symbol: string; quantity: number }[]>([]);

  const refreshAccount = useCallback(() => {
    if (!user) return;
    fetch("/api/wallet")
      .then((res) => res.json())
      .then((data) => setBalance(data.available ?? 0))
      .catch(() => {});
    fetch("/api/holdings")
      .then((res) => res.json())
      .then((data) => setHoldings(Array.isArray(data.holdings) ? data.holdings : []))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    refreshAccount();
  }, [refreshAccount]);

  const handlePlaceOrder = (order: PlacedOrder) => {
    setOrders((prev) => [order, ...prev]);
  };

  if (!coin) return null;

  if (!user) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
        <FiClock className="h-10 w-10 text-muted-foreground" />
        <h1 className="text-xl font-semibold text-foreground">Sign in to trade</h1>
        <p className="text-sm text-muted-foreground">
          Spot trading requires an account so we can validate your balance and track your orders.
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

  const holdingQty = holdings.find((h) => h.symbol === coin.symbol)?.quantity ?? 0;

  return (
    <div>
      <MarketStatsBar coin={coin} />

      <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_280px_320px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Balance{" "}
                <span className="font-mono font-medium text-foreground">${balance.toFixed(2)} USDT</span>
                <span className="mx-1.5">·</span>
                <span className="font-mono font-medium text-foreground">
                  {holdingQty} {coin.symbol}
                </span>
              </div>
              <Link href="/wallet" className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                <FiClipboard className="h-3.5 w-3.5" /> View Wallet
              </Link>
            </div>
            <CandlestickChart symbol={coin.symbol} price={coin.price} positive={coin.change24h >= 0} />
            <OrdersPanel orders={orders} />
          </div>

          <div className="rounded-2xl border border-border bg-card">
            <Tabs
              items={[
                { key: "book", label: "Order Book", content: <OrderBook price={coin.price} /> },
                { key: "trades", label: "Recent Trades", content: <RecentTrades price={coin.price} /> },
              ]}
              className="p-1"
            />
          </div>

          <TradePanel
            symbol={coin.symbol}
            price={coin.price}
            balance={balance}
            holdingQty={holdingQty}
            onPlaceOrder={handlePlaceOrder}
            onFilled={refreshAccount}
          />
        </div>
      </div>
    </div>
  );
}
