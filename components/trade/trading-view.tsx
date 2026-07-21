"use client";

import { useState } from "react";
import { useCoins } from "@/hooks/use-coins";
import { MarketStatsBar } from "@/components/trade/market-stats-bar";
import { CandlestickChart } from "@/components/trade/candlestick-chart";
import { OrderBook } from "@/components/trade/order-book";
import { RecentTrades } from "@/components/trade/recent-trades";
import { TradePanel, type PlacedOrder } from "@/components/trade/trade-panel";
import { OrdersPanel } from "@/components/trade/orders-panel";
import { Tabs } from "@/components/ui/tabs";

export function TradingView({ symbol }: { symbol: string }) {
  const liveCoins = useCoins(100);
  const coin = liveCoins.find((c) => c.symbol === symbol) ?? liveCoins[0];
  const [orders, setOrders] = useState<PlacedOrder[]>([]);

  const handlePlaceOrder = (order: PlacedOrder) => {
    setOrders((prev) => [order, ...prev]);
  };

  return (
    <div>
      <MarketStatsBar coin={coin} />

      <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_280px_320px]">
          <div className="space-y-4">
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

          <TradePanel symbol={coin.symbol} price={coin.price} onPlaceOrder={handlePlaceOrder} />
        </div>
      </div>
    </div>
  );
}
