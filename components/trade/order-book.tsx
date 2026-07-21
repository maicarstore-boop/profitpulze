"use client";

import { useEffect, useState } from "react";
import { generateOrderBook, type OrderBookLevel } from "@/lib/orderbook";
import { formatPrice } from "@/lib/market-data";
import { cn } from "@/lib/utils";

export function OrderBook({ price }: { price: number }) {
  const [book, setBook] = useState<{ bids: OrderBookLevel[]; asks: OrderBookLevel[] }>({
    bids: [],
    asks: [],
  });

  useEffect(() => {
    setBook(generateOrderBook(price));
    const interval = setInterval(() => setBook(generateOrderBook(price)), 2500);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Math.round(price)]);

  const maxTotal = Math.max(
    book.bids.at(-1)?.total ?? 1,
    book.asks[0]?.total ?? 1
  );

  return (
    <div className="text-xs">
      <div className="grid grid-cols-3 px-3 py-2 text-muted-foreground">
        <span>Price (USDT)</span>
        <span className="text-right">Size</span>
        <span className="text-right">Total</span>
      </div>

      <div className="space-y-px">
        {book.asks.map((level) => (
          <Row key={`ask-${level.price}`} level={level} side="ask" maxTotal={maxTotal} />
        ))}
      </div>

      <div className="px-3 py-2 text-base font-semibold text-success">
        ${formatPrice(price)}
      </div>

      <div className="space-y-px">
        {book.bids.map((level) => (
          <Row key={`bid-${level.price}`} level={level} side="bid" maxTotal={maxTotal} />
        ))}
      </div>
    </div>
  );
}

function Row({
  level,
  side,
  maxTotal,
}: {
  level: OrderBookLevel;
  side: "bid" | "ask";
  maxTotal: number;
}) {
  const width = Math.min((level.total / maxTotal) * 100, 100);
  return (
    <div className="relative grid grid-cols-3 px-3 py-0.5">
      <div
        className={cn(
          "absolute inset-y-0 right-0",
          side === "bid" ? "bg-success/10" : "bg-danger/10"
        )}
        style={{ width: `${width}%` }}
      />
      <span className={cn("relative", side === "bid" ? "text-success" : "text-danger")}>
        {formatPrice(level.price)}
      </span>
      <span className="relative text-right text-muted-foreground">{level.size.toFixed(3)}</span>
      <span className="relative text-right text-muted-foreground">{level.total.toFixed(3)}</span>
    </div>
  );
}
