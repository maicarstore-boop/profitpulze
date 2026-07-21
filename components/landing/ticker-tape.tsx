"use client";

import { FiArrowUp, FiArrowDown } from "react-icons/fi";
import { formatPrice } from "@/lib/market-data";
import { useCoins } from "@/hooks/use-coins";
import { cn } from "@/lib/utils";

export function TickerTape() {
  const coins = useCoins(25);
  const doubled = [...coins, ...coins];

  return (
    <div className="overflow-hidden border-b border-border bg-card py-2.5">
      <div className="ticker-track flex w-max gap-8">
        {doubled.map((coin, index) => {
          const positive = coin.change24h >= 0;
          return (
            <div
              key={`${coin.id}-${index}`}
              className="flex items-center gap-2 text-sm whitespace-nowrap"
            >
              <span className="font-semibold">{coin.symbol}/USDT</span>
              <span className="text-muted-foreground">${formatPrice(coin.price)}</span>
              <span
                className={cn(
                  "flex items-center gap-0.5 font-medium",
                  positive ? "text-success" : "text-danger"
                )}
              >
                {positive ? <FiArrowUp className="h-3 w-3" /> : <FiArrowDown className="h-3 w-3" />}
                {Math.abs(coin.change24h).toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
