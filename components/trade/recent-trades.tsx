"use client";

import { useEffect, useState } from "react";
import { generateRecentTrades, type RecentTrade } from "@/lib/orderbook";
import { formatPrice } from "@/lib/market-data";
import { cn } from "@/lib/utils";

export function RecentTrades({ price }: { price: number }) {
  const [trades, setTrades] = useState<RecentTrade[]>([]);

  useEffect(() => {
    setTrades(generateRecentTrades(price));
    const interval = setInterval(() => {
      setTrades((prev) => [generateRecentTrades(price, 1)[0], ...prev].slice(0, 20));
    }, 2200);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Math.round(price)]);

  return (
    <div className="text-xs">
      <div className="grid grid-cols-3 px-3 py-2 text-muted-foreground">
        <span>Price (USDT)</span>
        <span className="text-right">Size</span>
        <span className="text-right">Time</span>
      </div>
      <div>
        {trades.map((trade) => (
          <div key={trade.id} className="grid grid-cols-3 px-3 py-0.5">
            <span className={cn(trade.side === "buy" ? "text-success" : "text-danger")}>
              {formatPrice(trade.price)}
            </span>
            <span className="text-right text-muted-foreground">{trade.size.toFixed(3)}</span>
            <span className="text-right text-muted-foreground">{trade.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
